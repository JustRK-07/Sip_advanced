/*
  Warnings:

  - You are about to drop the column `transcript` on the `Conversation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Conversation_leadId_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "transcript";
