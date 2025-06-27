/*
  Warnings:

  - A unique constraint covering the columns `[firebaseId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseId_key" ON "User"("firebaseId");
