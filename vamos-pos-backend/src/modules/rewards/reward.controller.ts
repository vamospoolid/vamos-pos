import { Request, Response } from 'express';
import { prisma } from '../../database/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/errors';

// ─── Admin: Get all rewards ───────────────────────────────────────────────────
export const getRewards = catchAsync(async (req: Request, res: Response) => {
    const rewards = await prisma.reward.findMany({
        where: { isActive: true },
        include: { _count: { select: { redemptions: true } } },
        orderBy: { pointsRequired: 'asc' }
    });
    res.json({ success: true, data: rewards });
});

// ─── Admin: Create reward ─────────────────────────────────────────────────────
export const createReward = catchAsync(async (req: Request, res: Response) => {
    const { title, description, pointsRequired, stock, imageUrl } = req.body;
    if (!title || !pointsRequired) throw new AppError('title and pointsRequired are required', 400);

    const reward = await prisma.reward.create({
        data: {
            title,
            description: description || '',
            pointsRequired: Number(pointsRequired),
            stock: stock !== undefined ? Number(stock) : 999,
            imageUrl: imageUrl || null,
        }
    });
    res.status(201).json({ success: true, data: reward });
});

// ─── Admin: Update reward ─────────────────────────────────────────────────────
export const updateReward = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, pointsRequired, stock, imageUrl, isActive } = req.body;

    const reward = await prisma.reward.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(pointsRequired !== undefined && { pointsRequired: Number(pointsRequired) }),
            ...(stock !== undefined && { stock: Number(stock) }),
            ...(imageUrl !== undefined && { imageUrl }),
            ...(isActive !== undefined && { isActive }),
        }
    });
    res.json({ success: true, data: reward });
});

// ─── Admin: Delete reward ─────────────────────────────────────────────────────
export const deleteReward = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.reward.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Reward deactivated' });
});

// ─── Member: Redeem a reward ──────────────────────────────────────────────────
export const redeemReward = catchAsync(async (req: Request, res: Response) => {
    const { memberId, rewardId } = req.body;
    if (!memberId || !rewardId) throw new AppError('memberId and rewardId are required', 400);

    const [member, reward] = await Promise.all([
        prisma.member.findUnique({ where: { id: memberId } }),
        prisma.reward.findUnique({ where: { id: rewardId } }),
    ]);

    if (!member) throw new AppError('Member not found', 404);
    if (!reward || !reward.isActive) throw new AppError('Reward not found or inactive', 404);
    if (reward.stock <= 0) throw new AppError('Reward is out of stock', 400);
    if (member.loyaltyPoints < reward.pointsRequired) {
        throw new AppError(`Insufficient points. Need ${reward.pointsRequired}, have ${member.loyaltyPoints}`, 400);
    }

    // Atomic transaction: deduct points, decrement stock, create redemption
    const result = await prisma.$transaction(async (tx) => {
        const newPoints = member.loyaltyPoints - reward.pointsRequired;
        const updatedMember = await tx.member.update({
            where: { id: memberId },
            data: { loyaltyPoints: newPoints }
        });

        await tx.reward.update({
            where: { id: rewardId },
            data: { stock: reward.stock - 1 }
        });

        const redemption = await tx.redemption.create({
            data: { memberId, rewardId, status: 'PENDING' },
            include: { reward: true, member: { select: { name: true, loyaltyPoints: true } } }
        });

        return { redemption, remainingPoints: newPoints };
    });

    res.status(201).json({ success: true, data: result });
});

// ─── POS: Get all redemptions (to fulfill) ────────────────────────────────────
export const getRedemptions = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.query;
    const redemptions = await prisma.redemption.findMany({
        where: status ? { status: String(status) } : {},
        include: {
            member: { select: { id: true, name: true, phone: true, tier: true } },
            reward: true,
        },
        orderBy: { claimedAt: 'desc' }
    });
    res.json({ success: true, data: redemptions });
});

// ─── POS: Fulfill a redemption (mark as DELIVERED) ───────────────────────────
export const fulfillRedemption = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const redemption = await prisma.redemption.update({
        where: { id },
        data: { status: 'DELIVERED' },
        include: { member: true, reward: true }
    });
    res.json({ success: true, data: redemption });
});

// ─── Player: Get redemption history for a member ─────────────────────────────
export const getMemberRedemptions = catchAsync(async (req: Request, res: Response) => {
    const { memberId } = req.params;
    const redemptions = await prisma.redemption.findMany({
        where: { memberId },
        include: { reward: true },
        orderBy: { claimedAt: 'desc' }
    });
    res.json({ success: true, data: redemptions });
});
