/*
  Warnings:

  - You are about to drop the column `googleSub` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_googleSub_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleSub",
ADD COLUMN     "passwordHash" VARCHAR(255) NOT NULL;
