import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { PointTxType } from '@prisma/client';
import { logger } from '../../utils/logger';

// ── Config helpers ───────────────────────────────────────────────
async function getConfig() {
    let cfg = await prisma.loyaltyConfig.findUnique({ where: { id: 'global' } });
    if (!cfg) {
        cfg = await prisma.loyaltyConfig.create({
            data: { 
                id: 'global', 
                pointPerRupiah: 1, 
                streakThreshold: 5, 
                streakWindowDays: 30, 
                streakBonusPoints: 100, 
                isPointsEnabled: true, 
                updatedAt: new Date(),
                silverThreshold: 1000,
                goldThreshold: 2500,
                platinumThreshold: 5000,
                silverMultiplier: 1.1,
                goldMultiplier: 1.25,
                platinumMultiplier: 1.5
            }
        });
    }
    return cfg;
}

function getTierConfig(cfg: any) {
    return {
        BRONZE: { minExperience: 0, earnRate: 1 },
        SILVER: { minExperience: cfg.silverThreshold, earnRate: cfg.silverMultiplier },
        GOLD: { minExperience: cfg.goldThreshold, earnRate: cfg.goldMultiplier },
        PLATINUM: { minExperience: cfg.platinumThreshold, earnRate: cfg.platinumMultiplier }
    };
}

const MAINTENANCE_GOLD_HOURS = 15; // Kept for hours check if still relevant

function determineTier(experience: number, cfg: any): string {
    const tierMapping = getTierConfig(cfg);
    if (experience >= tierMapping.PLATINUM.minExperience) return 'PLATINUM';
    if (experience >= tierMapping.GOLD.minExperience) return 'GOLD';
    if (experience >= tierMapping.SILVER.minExperience) return 'SILVER';
    return 'BRONZE';
}

function getTierRate(tier: string, cfg: any): number {
    const tierMapping = getTierConfig(cfg);
    const tierData = tierMapping[tier as keyof typeof tierMapping];
    return tierData ? tierData.earnRate : 1;
}

function isDoublePointActive(cfg: any): boolean {
    if (!cfg.doublePointEnabled) return false;
    if (cfg.doublePointExpiry && cfg.doublePointExpiry < new Date()) return false;
    return true;
}

export class LoyaltyService {

    // ── Calculate & Award points after a paid session ────────────
    static async awardGamePoints(sessionId: string, memberId: string, amount: number) {
        const cfg = await getConfig();
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) throw new AppError('Member not found', 404);

        // Use dynamic divisor from config if available (default to 1000)
        const pointDivisor = (cfg as any).pointPerRupiah > 0 ? (1 / (cfg as any).pointPerRupiah) : 1000;
        const tierRate = getTierRate(member.tier, cfg);
        const base = Math.floor((amount / pointDivisor) * tierRate);
        const doubleMulti = isDoublePointActive(cfg) ? 2 : 1;
        const earned = base * doubleMulti;

        const desc = `Main biliar – Rp ${amount.toLocaleString('id-ID')}` +
            (isDoublePointActive(cfg) ? ' [2x Poin]' : '') +
            ` [${member.tier} tier: ${tierRate}x multiplier]`;

        // Update Tier progression based on HOURS (this should be checked after endSession updates hours)
        await LoyaltyService.syncTier(memberId);

        return LoyaltyService.addPoints(memberId, earned, 'EARN_GAME', desc, sessionId);
    }

    // ── Award FNB points ─────────────────────────────────────────
    static async awardFnbPoints(memberId: string, fnbAmount: number, sessionId?: string) {
        const cfg = await getConfig();
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) throw new AppError('Member not found', 404);

        const tierRate = getTierRate(member.tier, cfg);
        const pointDivisor = (cfg as any).pointPerRupiah > 0 ? (1 / (cfg as any).pointPerRupiah) : 1000;
        const base = Math.floor((fnbAmount / pointDivisor) * tierRate);
        const doubleMulti = isDoublePointActive(cfg) ? 2 : 1;
        const earned = base * doubleMulti;

        return LoyaltyService.addPoints(memberId, earned, 'EARN_FNB',
            `FNB – Rp ${fnbAmount.toLocaleString('id-ID')} [${tierRate}x multiplier]`, sessionId);
    }

    // ── Update Member Tier based on totalPlayHours ────────────────
    static async syncTier(memberId: string) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return;

        const m = member as any;
        const now = new Date();
        const lastSync = m.tierUpdatedAt ? new Date(m.tierUpdatedAt) : m.createdAt;
        
        // Cek apakah baru ganti bulan sejak update terakhir
        const isNewMonth = now.getMonth() !== lastSync.getMonth() || now.getFullYear() !== lastSync.getFullYear();

        // 1. Tentukan tier berdasarkan experience (Promotion)
        const cfg = await getConfig();
        const xpBasedTier = determineTier(m.experience || 0, cfg);
        let finalTier = xpBasedTier;

        // 2. Gold Maintenance Check (Demotion)
        // Hanya cek demosi jika:
        // - Sudah GOLD sebelumnya
        // - Ganti bulan (Hanya demote 1x di awal bulan)
        // - Dan tier xp-nya juga GOLD (kalau xp-nya aja udah turun ya biarkan xpBasedTier yg urus)
        if (m.tier === 'GOLD' && xpBasedTier === 'GOLD' && isNewMonth) {
            // Berikan grace period jika member baru naik GOLD di akhir bulan lalu?
            // Biasanya dicek jam main bulan lalu.
            const hoursLastMonth = m.lastMonthPlayHours || 0;
            if (hoursLastMonth < MAINTENANCE_GOLD_HOURS) {
                // Jangan demote jika baru saja dipromote bulan ini (tierUpdatedAt baru saja di-set hari ini)
                // Tapi isNewMonth sudah menghandle itu karena lastSync adalah tgl terakhir di-update.
                finalTier = 'SILVER';
                logger.info(`[Loyalty] Member ${m.name} demoted to SILVER (Activity: ${hoursLastMonth}h < ${MAINTENANCE_GOLD_HOURS}h)`);
            }
        }

        // Only update if tier changed or it's a new month (to refresh tierUpdatedAt)
        if (finalTier !== m.tier || isNewMonth) {
            await prisma.member.update({
                where: { id: memberId },
                data: {
                    tier: finalTier,
                    tierUpdatedAt: now
                } as any
            });

            // If it's a new month, also process point expiry
            if (isNewMonth) {
                await LoyaltyService.processPointExpiry(memberId);
            }
        }
    }

    // ── Award tournament rewards (Dynamic XP & Points) ───────────
    /**
     * Awards XP and Loyalty Points based on tournament scale.
     * Protects owner revenue by zeroing points for basic participation/wins.
     */
    static async awardTournamentRewards(
        memberId: string, 
        type: 'PARTICIPATE' | 'MATCH_WIN' | 'PLACEMENT', 
        entryFee: number = 0, 
        prizeAmount: number = 0
    ) {
        let xpEarned = 0;
        let pointsEarned = 0;
        let description = '';

        const cfg = await getConfig();
        const pointDivisor = (cfg as any).pointPerRupiah > 0 ? (1 / (cfg as any).pointPerRupiah) : 1000;

        switch (type) {
            case 'PARTICIPATE':
                // XP: 1 XP per pointDivisor IDR of entry fee (Max 100 XP)
                xpEarned = Math.min(100, Math.floor(entryFee / pointDivisor));
                // Points: 0 (To prevent "boncos")
                pointsEarned = 0;
                description = `🎟️ Partisipasi Tournament (+${xpEarned} XP)`;
                break;

            case 'MATCH_WIN':
                // XP: Flat prestige for winning a match
                xpEarned = 20; 
                // Points: 0
                pointsEarned = 0;
                description = `⚔️ Menang Match Tournament (+20 XP)`;
                break;

            case 'PLACEMENT':
                // XP: 1 XP per pointDivisor IDR of prize won
                xpEarned = Math.floor(prizeAmount / pointDivisor);
                // Points: 1 Point per (pointDivisor * 2) IDR of prize won (Balanced bonus)
                pointsEarned = Math.floor(prizeAmount / (pointDivisor * 2));
                description = `🏆 Placement Reward Tournament (+${xpEarned} XP, +${pointsEarned} Poin)`;
                break;
        }

        // 1. Award XP and handle Level Up
        if (xpEarned > 0) {
            const member = await prisma.member.findUnique({ where: { id: memberId } });
            if (member) {
                let newExp = (member.experience || 0) + xpEarned;
                let newLevel = member.level || 1;
                
                // Simple level up logic: Each level requires level * 1000 XP
                while (newExp >= (newLevel * 1000)) {
                    newExp -= (newLevel * 1000);
                    newLevel++;
                }

                await prisma.member.update({
                    where: { id: memberId },
                    data: { 
                        experience: newExp,
                        level: newLevel
                    }
                });
                
                // Sync Tier after XP/Level change
                await LoyaltyService.syncTier(memberId);
            }
        }

        // 2. Award Points (if any) and Log
        return LoyaltyService.addPoints(memberId, pointsEarned, 'EARN_TOURNAMENT', description);
    }

    // ── Streak tracking ───────────────────────────────────────────
    static async checkAndUpdateStreak(memberId: string) {
        const cfg = await getConfig();
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return;

        const now = new Date();
        const windowMs = cfg.streakWindowDays * 24 * 60 * 60 * 1000;
        const lastPlay = member.streakLastPlay;

        // Reset streak if last play was outside the window
        let newCount = member.streakCount;
        let rewarded = member.streakRewarded;

        if (!lastPlay || (now.getTime() - lastPlay.getTime()) > windowMs) {
            newCount = 1;
            rewarded = false;
        } else {
            newCount += 1;
        }

        // Check if streak threshold reached and not yet rewarded
        if (newCount >= cfg.streakThreshold && !rewarded) {
            await LoyaltyService.addPoints(
                memberId, cfg.streakBonusPoints, 'EARN_STREAK',
                `🔥 Streak ${cfg.streakThreshold}x dalam ${cfg.streakWindowDays} hari (+${cfg.streakBonusPoints} poin)`
            );
            rewarded = true;
        }

        await prisma.member.update({
            where: { id: memberId },
            data: { streakCount: newCount, streakLastPlay: now, streakRewarded: rewarded }
        });
    }

    // ── Redeem a reward ───────────────────────────────────────────
    static async redeem(memberId: string, rewardId: string) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

        if (!member) throw new AppError('Member tidak ditemukan', 404);
        if (!reward || !reward.isActive) throw new AppError('Reward tidak tersedia', 404);

        // CHECK RESTRICTIONS
        const now = new Date();
        const day = now.getDay();
        const restrictedDays = (reward as any).restrictedDays || [];
        if (restrictedDays.length > 0 && restrictedDays.includes(day)) {
            throw new AppError('Reward ini tidak dapat diklaim pada hari ini (Hari Sibuk)', 400);
        }

        if (member.loyaltyPoints < reward.pointsRequired) {
            throw new AppError(`Poin tidak cukup. Butuh ${reward.pointsRequired}, kamu punya ${member.loyaltyPoints}`, 400);
        }
        if (reward.stock <= 0) throw new AppError('Stok reward habis', 400);

        const result = await prisma.$transaction(async (tx) => {
            // Deduct points
            const newPoints = member.loyaltyPoints - reward.pointsRequired;

            const updatedMember = await tx.member.update({
                where: { id: memberId },
                data: { loyaltyPoints: newPoints }
            });

            // Reduce stock
            await tx.reward.update({
                where: { id: rewardId },
                data: { stock: reward.stock - 1 }
            });

            // Create redemption record
            const redemption = await tx.redemption.create({
                data: {
                    memberId,
                    rewardId,
                    pointsUsed: reward.pointsRequired,
                    status: 'PENDING',
                }
            });

            // Log the point deduction
            await tx.pointLog.create({
                data: {
                    memberId: memberId,
                    type: 'REDEEM',
                    points: -reward.pointsRequired,
                    description: `Redeem: ${reward.title}`,
                    redemptionId: redemption.id,
                }
            });

            return { redemption, updatedMember, reward };
        });

        const { getIO } = await import('../../socket');
        const io = getIO();
        if (io) {
            io.emit('redemptions:updated');
            io.emit('notification:new', {
                type: 'REDEMPTION',
                title: 'Request Penukaran Reward',
                message: `${member.name} menukarkan ${reward.title}`,
                memberId: member.id
            });
        }

        return result;
    }

    // ── Get member profile with loyalty info ─────────────────────
    static async getMemberLoyalty(memberId: string) {
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: {
                pointLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
                redemptions: { include: { reward: true }, orderBy: { claimedAt: 'desc' }, take: 10 },
            }
        });
        if (!member) throw new AppError('Member tidak ditemukan', 404);

        const cfg = await getConfig();
        const tierMapping = getTierConfig(cfg);
        const nextTier = member.tier === 'BRONZE' ? 'SILVER' : member.tier === 'SILVER' ? 'GOLD' : member.tier === 'GOLD' ? 'PLATINUM' : null;
        const currentConfig = tierMapping[member.tier as keyof typeof tierMapping];
        const nextConfig = nextTier ? tierMapping[nextTier as keyof typeof tierMapping] : null;

        const nextTarget = nextConfig ? nextConfig.minExperience : 0;
        const currentMin = currentConfig ? currentConfig.minExperience : 0;

        const progress = nextTarget > 0
            ? Math.min(100, Math.floor((((member as any).experience || 0) - currentMin) / (nextTarget - currentMin) * 100))
            : 100;

        return { member, nextTier, nextTarget, progress };
    }

    // ── Leaderboard top 10 ───────────────────────────────────────
    static async getLeaderboard() {
        return prisma.member.findMany({
            where: { deletedAt: null },
            orderBy: { loyaltyPoints: 'desc' },
            take: 10,
            select: { id: true, name: true, phone: true, tier: true, loyaltyPoints: true, streakCount: true },
        });
    }

    // ── Monthly point report ─────────────────────────────────────
    static async getMonthlyReport(year: number, month: number) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const logs = await prisma.pointLog.groupBy({
            by: ['type'],
            where: { createdAt: { gte: start, lt: end } },
            _sum: { points: true },
            _count: { id: true },
        });

        const totalMembers = await prisma.member.count({ where: { deletedAt: null } });

        return { year, month, logs, totalMembers };
    }

    // ── Toggle double point (admin) ──────────────────────────────
    static async toggleDoublePoint(enabled: boolean, expiryHours?: number, adminId?: string) {
        const expiry = enabled && expiryHours
            ? new Date(Date.now() + expiryHours * 3600000)
            : null;

        return prisma.loyaltyConfig.upsert({
            where: { id: 'global' },
            update: { doublePointEnabled: enabled, doublePointExpiry: expiry, updatedBy: adminId, updatedAt: new Date() },
            create: { id: 'global', doublePointEnabled: enabled, doublePointExpiry: expiry, updatedBy: adminId, updatedAt: new Date() },
        });
    }

    // ── Admin: get & update config ───────────────────────────────
    static async getConfig() { return getConfig(); }

    static async updateConfig(data: Partial<{
        pointPerRupiah: number;
        streakThreshold: number;
        streakWindowDays: number;
        streakBonusPoints: number;
        pointsExpiryDays: number;
        isPointsEnabled: boolean;
        silverThreshold: number;
        goldThreshold: number;
        platinumThreshold: number;
        silverMultiplier: number;
        goldMultiplier: number;
        platinumMultiplier: number;
    }>, adminId?: string) {
        return prisma.loyaltyConfig.update({
            where: { id: 'global' },
            data: { ...data, updatedBy: adminId, updatedAt: new Date() } as any,
        });
    }

    // ── Internal helper: add/subtract points atomically ──────────
    static async addPoints(
        memberId: string,
        points: number,
        type: PointTxType,
        description: string,
        sessionId?: string,
        redemptionId?: string,
    ) {
        const cfg = await getConfig();
        if (!cfg.isPointsEnabled && points > 0) {
            return { member: null, log: null, pointsEarned: 0 };
        }

        return prisma.$transaction(async (tx) => {
            const member = await tx.member.findUnique({ where: { id: memberId } });
            if (!member) throw new AppError('Member tidak ditemukan', 404);

            const newPoints = Math.max(0, member.loyaltyPoints + points);

            const [updatedMember, log] = await Promise.all([
                tx.member.update({
                    where: { id: memberId },
                    data: { loyaltyPoints: newPoints },
                }),
                tx.pointLog.create({
                    data: { memberId, type, points, description, sessionId, redemptionId }
                }),
            ]);

            return { member: updatedMember, log, pointsEarned: points };
        });
    }

    // ── Point Expiry Logic ───────────────────────────────────────
    static async processPointExpiry(memberId: string) {
        const config = await getConfig();
        const expiryDays = config.pointsExpiryDays || 180;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - expiryDays);

        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member || member.loyaltyPoints <= 0) return;

        // 1. Calculate total earned before expiryDate
        const earnedLogs = await prisma.pointLog.aggregate({
            where: {
                memberId,
                points: { gt: 0 },
                createdAt: { lt: expiryDate },
                type: { not: 'EXPIRY' as any } // Avoid infinity loop if we added EXPIRY logs
            },
            _sum: { points: true }
        });

        // 2. Calculate total points EVER spent
        const spentLogs = await prisma.pointLog.aggregate({
            where: {
                memberId,
                points: { lt: 0 },
                type: { not: 'EXPIRY' as any } // Don't count previous expiries as "spent" items that consume earns
            },
            _sum: { points: true }
        });

        const totalEarnedBefore = earnedLogs._sum.points || 0;
        const totalSpentLifetime = Math.abs(spentLogs._sum.points || 0);

        // Expired = Any points earned before expiry date that haven't been 'spent' by any negative transaction
        const potentialExpiring = totalEarnedBefore - totalSpentLifetime;

        if (potentialExpiring > 0) {
            // Check how many we already deducted as EXPIRY
            const alreadyExpired = await prisma.pointLog.aggregate({
                where: {
                    memberId,
                    type: 'EXPIRY' as any
                },
                _sum: { points: true }
            });
            
            const alreadyDeducted = Math.abs(alreadyExpired._sum.points || 0);
            const toDeduct = potentialExpiring - alreadyDeducted;

            if (toDeduct > 0) {
                 const finalDeduction = Math.min(toDeduct, member.loyaltyPoints);
                 if (finalDeduction > 0) {
                    await LoyaltyService.addPoints(
                        memberId, -finalDeduction, 'EXPIRY' as any,
                        `Poin Hangus (Kadaluarsa > ${expiryDays} hari)`
                    );
                 }
            }
        }
    }

    static async processAllExpiry() {
        const members = await prisma.member.findMany({
            where: { loyaltyPoints: { gt: 0 }, deletedAt: null },
            select: { id: true }
        });
        
        let count = 0;
        for (const m of members) {
            await LoyaltyService.processPointExpiry(m.id);
            count++;
        }
        return count;
    }
}
