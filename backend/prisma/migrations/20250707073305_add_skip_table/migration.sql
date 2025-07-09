-- CreateTable
CREATE TABLE "Skip" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "skippedUserId" INTEGER NOT NULL,
    "skippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skip_userId_skippedUserId_key" ON "Skip"("userId", "skippedUserId");
