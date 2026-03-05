-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "handicap" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "handicapLabel" TEXT DEFAULT 'Entry Fragger',
ALTER COLUMN "tier" SET DEFAULT 'BRONZE';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "TournamentParticipant" ADD COLUMN     "paymentNotes" TEXT;

-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "memberId" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
