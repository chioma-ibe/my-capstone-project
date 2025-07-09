/*
  Warnings:

  - You are about to drop the column `comment` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the `Skip` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,partnerId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "comment",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Skip";

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_partnerId_key" ON "Rating"("userId", "partnerId");
