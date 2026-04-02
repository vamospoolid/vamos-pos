import { Request, Response } from 'express';
import { prisma } from '../../database/db';
import { catchAsync } from '../../utils/catchAsync';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { getIO } from '../../socket';

export const getExpenses = catchAsync(async (req: Request, res: Response) => {
    const { memberId, status, isDebt } = req.query;
    const where: any = { deletedAt: null };

    if (memberId) where.memberId = memberId as string;
    if (status) where.status = status as string;
    if (isDebt === 'true') where.isDebt = true;

    const expenses = await prisma.expense.findMany({
        where,
        include: { member: { select: { name: true } } },
        orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: expenses });
});

export const getPendingDebtsCount = catchAsync(async (req: Request, res: Response) => {
    const count = await prisma.expense.count({
        where: {
            deletedAt: null,
            isDebt: true,
            status: 'PENDING'
        }
    });
    res.json({ success: true, count });
});

export const createExpense = catchAsync(async (req: AuthRequest, res: Response) => {
    const { category, amount, description, date, memberId, isDebt } = req.body;
    const userId = req.user!.id;

    // Cari shift kasir yang aktif agar pengeluaran memotong cash di shift tersebut
    const activeShift = await prisma.cashierShift.findFirst({
        where: { userId, status: 'OPEN' }
    });

    const expense = await prisma.expense.create({
        data: {
            category,
            amount: Number(amount),
            description,
            date: date ? new Date(date) : new Date(),
            shiftId: activeShift ? activeShift.id : null,
            memberId: memberId || null,
            isDebt: isDebt || category === 'DEBT',
            status: (isDebt || category === 'DEBT') ? 'PENDING' : 'PAID'
        }
    });
    getIO().emit('sessions:updated');
    getIO().emit('expenses:updated');
    res.status(201).json({ success: true, data: expense });
});

export const payDebt = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { method } = req.body;
    const userId = req.user!.id;

    const expense = await prisma.expense.findUnique({
        where: { id }
    });

    if (!expense || !expense.isDebt || expense.status !== 'PENDING') {
        throw new AppError('Data piutang tidak valid!', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
        // Cari shift kasir yang aktif
        const activeShift = await tx.cashierShift.findFirst({
            where: { userId, status: 'OPEN' }
        });

        // Buat record pembayaran agar masuk ke saldo/shift
        await tx.payment.create({
            data: {
                sessionId: expense.sessionId,
                amount: expense.amount,
                method: method || 'CASH',
                status: 'SUCCESS',
                cashierId: userId,
                shiftId: activeShift ? activeShift.id : undefined
            } as any
        });

        // Update status expense piutang jadi PAID
        const updatedExpense = await tx.expense.update({
            where: { id },
            data: { status: 'PAID' }
        });

        return updatedExpense;
    });

    getIO().emit('sessions:updated');
    getIO().emit('expenses:updated');
    res.json({ success: true, data: result });
});

export const deleteExpense = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.expense.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
    getIO().emit('sessions:updated');
    getIO().emit('expenses:updated');
    res.json({ success: true, message: 'Expense deleted successfully' });
});

export const bulkDeleteExpenses = catchAsync(async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('No IDs provided', 400);
    }

    await prisma.expense.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
    });

    getIO().emit('sessions:updated');
    res.json({ success: true, message: `${ids.length} expenses deleted successfully` });
});
