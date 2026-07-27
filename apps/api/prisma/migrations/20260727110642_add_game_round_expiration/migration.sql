-- AlterTable
ALTER TABLE "GameRound" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "GameRound"
SET "expiresAt" = "startedAt" + INTERVAL '120 seconds';

ALTER TABLE "GameRound" ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "GameRound_status_expiresAt_idx" ON "GameRound"("status", "expiresAt");
