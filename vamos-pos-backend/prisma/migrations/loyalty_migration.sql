-- Loyalty System Migration
-- Run: npx prisma db execute --file prisma/migrations/loyalty_migration.sql --schema prisma/schema.prisma

-- 1. Add new columns to Reward
ALTER TABLE "Reward" 
  ADD COLUMN IF NOT EXISTS "rewardType" TEXT NOT NULL DEFAULT 'DISCOUNT',
  ADD COLUMN IF NOT EXISTS "value" FLOAT8 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Add new columns to Redemption
ALTER TABLE "Redemption"
  ADD COLUMN IF NOT EXISTS "pointsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 3. Update Member table
ALTER TABLE "Member"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "streakCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streakLastPlay" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "streakRewarded" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Member" ALTER COLUMN "tier" SET DEFAULT 'SILVER';

-- 4. Create enum types
DO $$ BEGIN
  CREATE TYPE "RewardType" AS ENUM ('DISCOUNT','FREE_GAME','FNB_VOUCHER','VIP_ACCESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PointTxType" AS ENUM ('EARN_GAME','EARN_FNB','EARN_TOURNAMENT','EARN_STREAK','EARN_BONUS','REDEEM','ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create PointLog table
CREATE TABLE IF NOT EXISTS "PointLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "memberId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "sessionId" TEXT,
  "redemptionId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("memberId") REFERENCES "Member"("id")
);

-- 6. Create LoyaltyConfig table
CREATE TABLE IF NOT EXISTS "LoyaltyConfig" (
  "id" TEXT PRIMARY KEY DEFAULT 'global',
  "doublePointEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "doublePointExpiry" TIMESTAMPTZ,
  "pointPerRupiah" FLOAT8 NOT NULL DEFAULT 0.001,
  "streakThreshold" INTEGER NOT NULL DEFAULT 5,
  "streakWindowDays" INTEGER NOT NULL DEFAULT 30,
  "streakBonusPoints" INTEGER NOT NULL DEFAULT 100,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT
);

-- 7. Seed default config
INSERT INTO "LoyaltyConfig" ("id","doublePointEnabled","pointPerRupiah","streakThreshold","streakWindowDays","streakBonusPoints","updatedAt")
VALUES ('global', FALSE, 0.001, 5, 30, 100, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 8. Email unique index (nullable unique)
CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email") WHERE "email" IS NOT NULL;

-- 9. Seed default rewards
INSERT INTO "Reward" ("id","title","description","pointsRequired","rewardType","value","stock","isActive","createdAt","updatedAt")
VALUES
  (gen_random_uuid()::TEXT, 'Diskon Rp 10.000', 'Potongan tagihan sebesar Rp 10.000', 100, 'DISCOUNT', 10000, 999, TRUE, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'Gratis 1 Jam Siang', 'Main gratis 1 jam waktu siang (sebelum 18:00)', 250, 'FREE_GAME', 1, 500, TRUE, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'Gratis 2 Jam Siang', 'Main gratis 2 jam waktu siang (sebelum 18:00)', 400, 'FREE_GAME', 2, 500, TRUE, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'Voucher FNB Rp 50.000', 'Voucher makan & minum senilai Rp 50.000', 500, 'FNB_VOUCHER', 50000, 300, TRUE, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'Gratis 2 Jam Malam', 'Main gratis 2 jam waktu malam (setelah 18:00)', 800, 'FREE_GAME', 2, 200, TRUE, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'VIP Member 1 Bulan', 'Status VIP Member selama 30 hari, priority booking', 1500, 'VIP_ACCESS', 30, 50, TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;
