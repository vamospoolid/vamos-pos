-- CreateEnum
CREATE TYPE "EliminationType" AS ENUM ('SINGLE', 'DOUBLE');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('WINNERS', 'LOSERS');

-- CreateEnum
CREATE TYPE "SyncState" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterEnum
ALTER TYPE "PointTxType" ADD VALUE 'EXPIRY';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_sessionId_fkey";

-- AlterTable
ALTER TABLE "CashierShift" ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "isDebt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memberId" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PAID',
ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "LoyaltyConfig" ADD COLUMN     "goldMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
ADD COLUMN     "goldThreshold" INTEGER NOT NULL DEFAULT 2500,
ADD COLUMN     "isPointsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "platinumMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "platinumThreshold" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "pointsExpiryDays" INTEGER NOT NULL DEFAULT 180,
ADD COLUMN     "silverMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
ADD COLUMN     "silverThreshold" INTEGER NOT NULL DEFAULT 1000,
ALTER COLUMN "pointPerRupiah" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "MatchChallenge" ADD COLUMN     "note" TEXT,
ADD COLUMN     "score1" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score2" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "currentMonthPlayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "highestKingStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastMonthPlayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "ratingConfidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skillRating" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tierUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "handicap" SET DEFAULT '4',
ALTER COLUMN "handicap" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "sessionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isRestricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restrictedDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "billingType" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalPausedMs" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "isKingTable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "eliminationType" "EliminationType" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "transitionSize" INTEGER NOT NULL DEFAULT 32;

-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN     "bracket" "BracketType" NOT NULL DEFAULT 'WINNERS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "isSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "syncIntervalSeconds" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "WaTemplate" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "syncStatus" "SyncState" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "hardwareId" TEXT,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ADJUSTMENT',
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KingTable" (
    "tableId" TEXT NOT NULL,
    "kingMemberId" TEXT NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "sinceMatchId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KingTable_pkey" PRIMARY KEY ("tableId")
);

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "License_hardwareId_key" ON "License"("hardwareId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CashierShift_syncStatus_idx" ON "CashierShift"("syncStatus");

-- CreateIndex
CREATE INDEX "Expense_memberId_isDebt_idx" ON "Expense"("memberId", "isDebt");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_syncStatus_idx" ON "Expense"("syncStatus");

-- CreateIndex
CREATE INDEX "Member_syncStatus_idx" ON "Member"("syncStatus");

-- CreateIndex
CREATE INDEX "Order_sessionId_idx" ON "Order"("sessionId");

-- CreateIndex
CREATE INDEX "Order_syncStatus_idx" ON "Order"("syncStatus");

-- CreateIndex
CREATE INDEX "Payment_sessionId_idx" ON "Payment"("sessionId");

-- CreateIndex
CREATE INDEX "Payment_shiftId_idx" ON "Payment"("shiftId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_syncStatus_idx" ON "Payment"("syncStatus");

-- CreateIndex
CREATE INDEX "PointLog_memberId_idx" ON "PointLog"("memberId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_tableId_idx" ON "Session"("tableId");

-- CreateIndex
CREATE INDEX "Session_memberId_idx" ON "Session"("memberId");

-- CreateIndex
CREATE INDEX "Session_status_durationOpts_idx" ON "Session"("status", "durationOpts");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Session_syncStatus_idx" ON "Session"("syncStatus");

-- CreateIndex
CREATE INDEX "Waitlist_syncStatus_idx" ON "Waitlist"("syncStatus");

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KingTable" ADD CONSTRAINT "KingTable_kingMemberId_fkey" FOREIGN KEY ("kingMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KingTable" ADD CONSTRAINT "KingTable_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchChallenge" ADD CONSTRAINT "MatchChallenge_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
