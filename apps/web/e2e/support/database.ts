import { createHash } from "node:crypto";
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
