-- CreateEnum
CREATE TYPE "WordDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "Word" (
    "id" UUID NOT NULL,
    "answer" VARCHAR(50) NOT NULL,
    "normalizedAnswer" VARCHAR(50) NOT NULL,
    "category" VARCHAR(30) NOT NULL DEFAULT '전체',
    "difficulty" "WordDifficulty" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_normalizedAnswer_key" ON "Word"("normalizedAnswer");

-- CreateIndex
CREATE INDEX "Word_difficulty_isActive_idx" ON "Word"("difficulty", "isActive");
