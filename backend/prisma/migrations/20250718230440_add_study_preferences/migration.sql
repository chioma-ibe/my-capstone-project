-- CreateTable
CREATE TABLE "StudyPreferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "preferredDays" TEXT NOT NULL,
    "preferredTimeRanges" TEXT NOT NULL,
    "preferBackToBack" BOOLEAN NOT NULL DEFAULT false,
    "maxSessionsPerWeek" INTEGER NOT NULL DEFAULT 5,
    "sessionDuration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyPreferences_userId_key" ON "StudyPreferences"("userId");

-- AddForeignKey
ALTER TABLE "StudyPreferences" ADD CONSTRAINT "StudyPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
