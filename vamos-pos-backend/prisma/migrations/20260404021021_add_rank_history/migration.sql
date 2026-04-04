-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "RankHistory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "oldHandicap" TEXT,
    "newHandicap" TEXT NOT NULL,
    "oldRating" INTEGER,
    "newRating" INTEGER NOT NULL,
    "reason" TEXT,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankHistory_memberId_idx" ON "RankHistory"("memberId");

-- CreateIndex
CREATE INDEX "RankHistory_createdAt_idx" ON "RankHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
