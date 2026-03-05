-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "identityStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "isPhotoVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWaVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photoVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "waVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "dayOfWeek" INTEGER[],
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "fnbItems" TEXT,
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "fnbIncluded" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "venue" TEXT;

-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "pointsCost" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "targetUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchChallenge" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "pointsStake" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFightForTable" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,

    CONSTRAINT "MatchChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiscountCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchChallenge" ADD CONSTRAINT "MatchChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchChallenge" ADD CONSTRAINT "MatchChallenge_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
