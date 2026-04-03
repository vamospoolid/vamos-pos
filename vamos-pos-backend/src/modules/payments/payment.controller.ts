import { Request, Response } from 'express';
import { prisma } from '../../database/db';
import { catchAsync } from '../../utils/catchAsync';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { getIO } from '../../socket';

export const createManualIncome = catchAsync(async (req: AuthRequest, res: Response) => {
    const { amount, method, notes } = req.body;
    const userId = req.user!.id;

    if (!amount || amount <= 0) {
        throw new AppError('Jumlah pemasukan tidak valid', 400);
    }

    // Cari shift kasir yang aktif agar pemasukan masuk ke cash shift tersebut
    const activeShift = await prisma.cashierShift.findFirst({
        where: { userId, status: 'OPEN' }
    });

    const payment = await prisma.payment.create({
        data: {
            amount: Number(amount),
            method: method || 'CASH',
            notes: notes || 'Pemasukan Lain-Lain',
            status: 'SUCCESS',
            cashierId: userId,
            shiftId: activeShift ? activeShift.id : null,
            sessionId: null // null means manual income / external revenue
        } as any
    });

    // Notify connected clients that financial data is updated
    getIO().emit('sessions:updated');
    
    res.status(201).json({ success: true, data: payment });
});

export const getManualIncomes = catchAsync(async (req: Request, res: Response) => {
    const payments = await prisma.payment.findMany({
        where: {
            sessionId: null,
            status: 'SUCCESS'
        },
        orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: payments });
});
