-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('PLAYING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameRoundStatus" AS ENUM ('DRAWING', 'FINISHED', 'SKIPPED');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" UUID NOT NULL,
    "roomId" UUID,
    "roomCode" VARCHAR(8) NOT NULL,
    "roomTitle" VARCHAR(50) NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'PLAYING',
    "totalRounds" SMALLINT NOT NULL DEFAULT 10,
    "currentRoundNumber" SMALLINT NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" UUID NOT NULL,
    "gameSessionId" UUID NOT NULL,
    "wordId" UUID NOT NULL,
    "drawerParticipantId" UUID,
    "guessedByParticipantId" UUID,
    "roundNumber" SMALLINT NOT NULL,
    "status" "GameRoundStatus" NOT NULL DEFAULT 'DRAWING',
    "answerSnapshot" VARCHAR(50) NOT NULL,
    "difficultySnapshot" "WordDifficulty" NOT NULL,
    "guesserScore" INTEGER NOT NULL DEFAULT 0,
    "drawerScore" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_roomId_status_startedAt_idx" ON "GameSession"("roomId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "GameRound_wordId_idx" ON "GameRound"("wordId");

-- CreateIndex
CREATE INDEX "GameRound_drawerParticipantId_idx" ON "GameRound"("drawerParticipantId");

-- CreateIndex
CREATE INDEX "GameRound_guessedByParticipantId_idx" ON "GameRound"("guessedByParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_gameSessionId_roundNumber_key" ON "GameRound"("gameSessionId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_gameSessionId_wordId_key" ON "GameRound"("gameSessionId", "wordId");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_drawerParticipantId_fkey" FOREIGN KEY ("drawerParticipantId") REFERENCES "RoomParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_guessedByParticipantId_fkey" FOREIGN KEY ("guessedByParticipantId") REFERENCES "RoomParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
