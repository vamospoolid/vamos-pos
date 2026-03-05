-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "experience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVerificationRewardClaimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "serviceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "blinkWarningMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "servicePercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 11;

-- CreateTable
CREATE TABLE "WaTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "WaTemplate_pkey" PRIMARY KEY ("id")
);
