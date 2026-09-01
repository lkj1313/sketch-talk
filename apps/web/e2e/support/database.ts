import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { Client } from "pg";

config({
  path: fileURLToPath(new URL("../../../api/.env", import.meta.url)),
  override: false,
  quiet: true,
});

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Playwright 테스트용 DATABASE_URL이 필요합니다.");
  }

  return databaseUrl;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function cleanupAuthTestData(
  email: string,
  guestToken?: string,
): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });

  await client.connect();

  try {
    await client.query('DELETE FROM "User" WHERE email = $1', [email]);

    if (guestToken) {
      await client.query('DELETE FROM "GuestSession" WHERE "tokenHash" = $1', [
        hashToken(guestToken),
      ]);
    }
  } finally {
    await client.end();
  }
}

export async function createGameTestWords(): Promise<string[]> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  const wordIds = [randomUUID(), randomUUID()];
  const createdAt = new Date();

  await client.connect();

  try {
    await client.query("BEGIN");

    for (const [index, wordId] of wordIds.entries()) {
      const answer = `Playwright제시어${wordId.slice(0, 8)}`;

      await client.query(
        `INSERT INTO "Word" (
          id,
          answer,
          "normalizedAnswer",
          category,
          difficulty,
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          wordId,
          answer,
          answer.toLocaleLowerCase("ko-KR"),
          "E2E",
          index === 0 ? "EASY" : "MEDIUM",
          createdAt,
        ],
      );
    }

    await client.query("COMMIT");

    return wordIds;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

type CleanupRoomTestDataOptions = {
  roomCode?: string;
  guestTokens: Array<string | undefined>;
  wordIds: string[];
};

export async function cleanupRoomTestData({
  roomCode,
  guestTokens,
  wordIds,
}: CleanupRoomTestDataOptions): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  const tokenHashes = guestTokens
    .filter((token): token is string => Boolean(token))
    .map(hashToken);

  await client.connect();

  try {
    await client.query("BEGIN");

    if (roomCode) {
      await client.query('DELETE FROM "GameSession" WHERE "roomCode" = $1', [
        roomCode,
      ]);
      await client.query('DELETE FROM "Room" WHERE code = $1', [roomCode]);
    }

    if (tokenHashes.length > 0) {
      await client.query(
        'DELETE FROM "GuestSession" WHERE "tokenHash" = ANY($1::text[])',
        [tokenHashes],
      );
    }

    if (wordIds.length > 0) {
      await client.query('DELETE FROM "Word" WHERE id = ANY($1::uuid[])', [
        wordIds,
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
