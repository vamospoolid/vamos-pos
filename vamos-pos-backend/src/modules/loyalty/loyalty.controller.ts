import { Request, Response } from 'express';
import { LoyaltyService } from './loyalty.service';
import { catchAsync } from '../../utils/catchAsync';
import { prisma } from '../../database/db';

// ── Member ────────────────────────────────────────────────────────
export const getMemberLoyalty = catchAsync(async (req: Request, res: Response) => {
    const result = await LoyaltyService.getMemberLoyalty(req.params.id);
    res.json({ success: true, data: result });
});

export const getMemberPoints = catchAsync(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, loyaltyPoints: true, tier: true, streakCount: true }
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });
    res.json({ success: true, data: member });
});

// ── Redeem ────────────────────────────────────────────────────────
export const redeemReward = catchAsync(async (req: Request, res: Response) => {
    const { memberId, rewardId } = req.body;
    if (!memberId || !rewardId)
        return res.status(400).json({ success: false, message: 'memberId dan rewardId wajib diisi' });
    const result = await LoyaltyService.redeem(memberId, rewardId);
    res.json({ success: true, data: result, message: 'Reward berhasil ditukar!' });
});

// ── Rewards CRUD ─────────────────────────────────────────────────
export const getRewards = catchAsync(async (req: Request, res: Response) => {
    const onlyActive = req.query.active !== 'false';
    const rewards = await prisma.reward.findMany({
        where: onlyActive ? { isActive: true } : {},
        orderBy: { pointsRequired: 'asc' },
    });
    res.json({ success: true, data: rewards });
});

export const createReward = catchAsync(async (req: Request, res: Response) => {
    const { title, description, pointsRequired, rewardType, value, stock, imageUrl } = req.body;
    const reward = await prisma.reward.create({
        data: { title, description, pointsRequired: Number(pointsRequired), rewardType: rewardType || 'DISCOUNT', value: Number(value || 0), stock: Number(stock ?? 999), imageUrl }
    });
    res.status(201).json({ success: true, data: reward });
});

export const updateReward = catchAsync(async (req: Request, res: Response) => {
    const reward = await prisma.reward.update({
        where: { id: req.params.id },
        data: req.body,
    });
    res.json({ success: true, data: reward });
});

export const deleteReward = catchAsync(async (req: Request, res: Response) => {
    await prisma.reward.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Reward dinonaktifkan' });
});

// ── Admin Panel ───────────────────────────────────────────────────
export const toggleDoublePoint = catchAsync(async (req: Request, res: Response) => {
    const { enabled, expiryHours } = req.body;
    const adminId = (req as any).user?.id;
    const cfg = await LoyaltyService.toggleDoublePoint(!!enabled, expiryHours, adminId);
    res.json({ success: true, data: cfg, message: enabled ? `Double point aktif${expiryHours ? ` selama ${expiryHours} jam` : ''}` : 'Double point dinonaktifkan' });
});

export const getLoyaltyConfig = catchAsync(async (_req: Request, res: Response) => {
    const cfg = await LoyaltyService.getConfig();
    res.json({ success: true, data: cfg });
});

export const updateLoyaltyConfig = catchAsync(async (req: Request, res: Response) => {
    const adminId = (req as any).user?.id;
    const cfg = await LoyaltyService.updateConfig(req.body, adminId);
    res.json({ success: true, data: cfg });
});

export const getLeaderboard = catchAsync(async (_req: Request, res: Response) => {
    const data = await LoyaltyService.getLeaderboard();
    res.json({ success: true, data });
});

export const getMonthlyReport = catchAsync(async (req: Request, res: Response) => {
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
    const data = await LoyaltyService.getMonthlyReport(year, month);
    res.json({ success: true, data });
});

// ── Manual point adjustment (admin) ──────────────────────────────
export const awardPointsManual = catchAsync(async (req: Request, res: Response) => {
    const { memberId, points, description } = req.body;
    if (!memberId || !points) return res.status(400).json({ success: false, message: 'memberId dan points wajib diisi' });

    // Use internal method via a thin re-export
    const { prisma: db } = await import('../../database/db');
    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });

    const newPoints = Math.max(0, member.loyaltyPoints + Number(points));
    const tier = newPoints >= 1500 ? 'PLATINUM' : newPoints >= 500 ? 'GOLD' : 'SILVER';

    await db.$transaction([
        db.member.update({ where: { id: memberId }, data: { loyaltyPoints: newPoints, tier } }),
        db.pointLog.create({ data: { memberId, type: 'ADJUSTMENT', points: Number(points), description: description || 'Penyesuaian poin oleh admin' } }),
    ]);

    res.json({ success: true, message: `Poin ${points > 0 ? 'ditambah' : 'dikurangi'} ${Math.abs(points)}`, data: { loyaltyPoints: newPoints, tier } });
});

// ── Get redemption list (admin) ────────────────────────────────────
export const getRedemptions = catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const redemptions = await prisma.redemption.findMany({
        where: status ? { status } : {},
        include: { member: { select: { id: true, name: true, phone: true } }, reward: true },
        orderBy: { claimedAt: 'desc' },
        take: 50,
    });
    res.json({ success: true, data: redemptions });
});

export const getPointLogs = catchAsync(async (req: Request, res: Response) => {
    const logs = await prisma.pointLog.findMany({
        include: { member: { select: { id: true, name: true, tier: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });
    res.json({ success: true, data: logs });
});

export const updateRedemptionStatus = catchAsync(async (req: Request, res: Response) => {
    const redemption = await prisma.redemption.update({
        where: { id: req.params.id },
        data: { status: req.body.status, notes: req.body.notes },
    });

    const { getIO } = await import('../../socket');
    const io = getIO();
    if (io) {
        io.emit('redemptions:updated');
    }

    res.json({ success: true, data: redemption });
});

export const getPendingRedemptionCount = catchAsync(async (_req: Request, res: Response) => {
    const count = await prisma.redemption.count({
        where: { status: 'PENDING' }
    });
    res.json({ success: true, count });
});

export const runPointExpiry = catchAsync(async (_req: Request, res: Response) => {
    const count = await LoyaltyService.processAllExpiry();
    res.json({ success: true, message: `Berhasil memproses kadaluarsa poin untuk ${count} member.` });
});
