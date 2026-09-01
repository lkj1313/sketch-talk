-- CreateTable
CREATE TABLE "GamePlayerResult" (
    "id" UUID NOT NULL,
    "gameSessionId" UUID NOT NULL,
    "userId" UUID,
    "participantIdSnapshot" UUID NOT NULL,
    "nicknameSnapshot" VARCHAR(30) NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlayerResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GamePlayerResult_userId_createdAt_idx" ON "GamePlayerResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GamePlayerResult_gameSessionId_rank_idx" ON "GamePlayerResult"("gameSessionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayerResult_gameSessionId_participantIdSnapshot_key" ON "GamePlayerResult"("gameSessionId", "participantIdSnapshot");

-- AddForeignKey
ALTER TABLE "GamePlayerResult" ADD CONSTRAINT "GamePlayerResult_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerResult" ADD CONSTRAINT "GamePlayerResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
