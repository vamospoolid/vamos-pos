import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { PointTxType } from '@prisma/client';

// ── Tier thresholds ─────────────────────────────────────────────
// ── Tier thresholds ─────────────────────────────────────────────
const TIER_THRESHOLDS = {
    BRONZE: { min: 0, bonus: 0.00 },
    SILVER: { min: 1000, bonus: 0.05 }, // +5% points
    GOLD: { min: 2000, bonus: 0.10 },   // +10% points
    PLATINUM: { min: 3000, bonus: 0.15 }, // +15% points
};

function getTier(points: number): string {
    if (points >= 3000) return 'PLATINUM';
    if (points >= 2000) return 'GOLD';
    if (points >= 1000) return 'SILVER';
    return 'BRONZE';
}

function getTierBonus(tier: string): number {
    return TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS]?.bonus ?? 0;
}

// ── Config helpers ───────────────────────────────────────────────
async function getConfig() {
    let cfg = await prisma.loyaltyConfig.findUnique({ where: { id: 'global' } });
    if (!cfg) {
        cfg = await prisma.loyaltyConfig.create({
            data: { id: 'global', pointPerRupiah: 0.001, streakThreshold: 5, streakWindowDays: 30, streakBonusPoints: 100, updatedAt: new Date() }
        });
    }
    return cfg;
}

function isDoublePointActive(cfg: Awaited<ReturnType<typeof getConfig>>): boolean {
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

        const normalizedAmount = amount < 2000 ? amount * 1000 : amount;
        const base = Math.floor(normalizedAmount * cfg.pointPerRupiah);          // 1 pt per 1000
        const tierBonus = Math.floor(base * getTierBonus(member.tier));
        const doubleMulti = isDoublePointActive(cfg) ? 2 : 1;
        const earned = (base + tierBonus) * doubleMulti;

        const desc = `Main biliar – Rp ${normalizedAmount.toLocaleString('id-ID')}` +
            (isDoublePointActive(cfg) ? ' [2x Poin]' : '') +
            (tierBonus > 0 ? ` [+${member.tier} bonus]` : '');

        return LoyaltyService.addPoints(memberId, earned, 'EARN_GAME', desc, sessionId);
    }

    // ── Award FNB points ─────────────────────────────────────────
    static async awardFnbPoints(memberId: string, fnbAmount: number, sessionId?: string) {
        const cfg = await getConfig();
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) throw new AppError('Member not found', 404);

        const normalizedAmount = fnbAmount < 2000 ? fnbAmount * 1000 : fnbAmount;
        const base = Math.floor(normalizedAmount * cfg.pointPerRupiah);
        const tierBonus = Math.floor(base * getTierBonus(member.tier));
        const doubleMulti = isDoublePointActive(cfg) ? 2 : 1;
        const earned = (base + tierBonus) * doubleMulti;

        return LoyaltyService.addPoints(memberId, earned, 'EARN_FNB',
            `FNB – Rp ${normalizedAmount.toLocaleString('id-ID')}`, sessionId);
    }

    // ── Award tournament points ───────────────────────────────────
    static async awardTournamentPoints(memberId: string, placement: 'PARTICIPATE' | 'CHAMPION' | 'RUNNER_UP') {
        const POINTS: Record<string, number> = {
            PARTICIPATE: 200,
            CHAMPION: 500,
            RUNNER_UP: 300,
        };
        const pts = POINTS[placement];
        const desc: Record<string, string> = {
            PARTICIPATE: 'Ikut Tournament (+200 poin)',
            CHAMPION: '🏆 Juara 1 Tournament (+500 poin)',
            RUNNER_UP: '🥈 Juara 2 Tournament (+300 poin)',
        };
        return LoyaltyService.addPoints(memberId, pts, 'EARN_TOURNAMENT', desc[placement]);
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
        const [member, reward] = await Promise.all([
            prisma.member.findUnique({ where: { id: memberId } }),
            prisma.reward.findUnique({ where: { id: rewardId } }),
        ]);

        if (!member) throw new AppError('Member tidak ditemukan', 404);
        if (!reward || !reward.isActive) throw new AppError('Reward tidak tersedia', 404);
        if (member.loyaltyPoints < reward.pointsRequired) {
            throw new AppError(`Poin tidak cukup. Butuh ${reward.pointsRequired}, kamu punya ${member.loyaltyPoints}`, 400);
        }
        if (reward.stock <= 0) throw new AppError('Stok reward habis', 400);

        return prisma.$transaction(async (tx) => {
            // Deduct points
            const newPoints = member.loyaltyPoints - reward.pointsRequired;
            const newTier = getTier(newPoints);

            const updatedMember = await tx.member.update({
                where: { id: memberId },
                data: { loyaltyPoints: newPoints, tier: newTier }
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
                    memberId,
                    type: 'REDEEM',
                    points: -reward.pointsRequired,
                    description: `Redeem: ${reward.title}`,
                    redemptionId: redemption.id,
                }
            });

            return { redemption, updatedMember, reward };
        });
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

        const nextTier = member.tier === 'BRONZE' ? 'SILVER' : member.tier === 'SILVER' ? 'GOLD' : member.tier === 'GOLD' ? 'PLATINUM' : null;
        const nextTarget = nextTier ? TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS].min : null;
        const currentMin = TIER_THRESHOLDS[member.tier as keyof typeof TIER_THRESHOLDS]?.min ?? 0;
        const progress = nextTarget ? Math.min(100, Math.floor(((member.loyaltyPoints - currentMin) / (nextTarget - currentMin)) * 100)) : 100;

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
    }>, adminId?: string) {
        return prisma.loyaltyConfig.update({
            where: { id: 'global' },
            data: { ...data, updatedBy: adminId, updatedAt: new Date() },
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
        return prisma.$transaction(async (tx) => {
            const member = await tx.member.findUnique({ where: { id: memberId } });
            if (!member) throw new AppError('Member tidak ditemukan', 404);

            const newPoints = Math.max(0, member.loyaltyPoints + points);
            const newTier = getTier(newPoints);

            const [updatedMember, log] = await Promise.all([
                tx.member.update({
                    where: { id: memberId },
                    data: { loyaltyPoints: newPoints, tier: newTier },
                }),
                tx.pointLog.create({
                    data: { memberId, type, points, description, sessionId, redemptionId }
                }),
            ]);

            return { member: updatedMember, log, pointsEarned: points };
        });
    }
}
