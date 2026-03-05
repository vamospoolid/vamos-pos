import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class ShiftService {
    static async startShift(userId: string, startingCash: number, notes?: string) {
        // Cek apakah kasir ini sudah punya shift yang masih OPEN
        const existingShift = await prisma.cashierShift.findFirst({
            where: { userId, status: 'OPEN' }
        });

        if (existingShift) {
            throw new AppError('Anda sudah memiliki shift yang masih terbuka. Silakan tutup shift Anda sebelum membuka yang baru.', 400);
        }

        const shift = await prisma.cashierShift.create({
            data: {
                userId,
                startingCash,
                notes,
                status: 'OPEN',
            }
        });

        await AuditService.log(userId, 'SHIFT_START', 'CashierShift', { shiftId: shift.id, startingCash });
        return shift;
    }

    static async getActiveShift(userId: string) {
        return prisma.cashierShift.findFirst({
            where: { userId, status: 'OPEN' },
            include: { payments: true }
        });
    }

    static async closeShift(userId: string, endingCashActual: number, notes?: string) {
        const shift = await prisma.cashierShift.findFirst({
            where: { userId, status: 'OPEN' },
            include: { payments: true }
        });

        if (!shift) {
            throw new AppError('Anda tidak mempunyai shift yang sedang aktif.', 400);
        }

        const endTime = new Date();

        // Hitung ekspektasi cash dari pembayaran (misal ada cash in / dll di payment method CASH)
        const expectedCashPayments = shift.payments
            .filter((p: any) => p.method === 'CASH' && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const expectedQris = shift.payments
            .filter((p: any) => p.method === 'QRIS' && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const expectedCard = shift.payments
            .filter((p: any) => p.method === 'CARD' && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const expectedCash = shift.startingCash + expectedCashPayments;

        const updatedShift = await prisma.cashierShift.update({
            where: { id: shift.id },
            data: {
                status: 'CLOSED',
                endTime,
                endingCashActual,
                expectedCash,
                expectedQris,
                expectedCard,
                notes: notes || shift.notes
            }
        });

        await AuditService.log(userId, 'SHIFT_CLOSE', 'CashierShift', { shiftId: shift.id, expectedCash, endingCashActual });
        return updatedShift;
    }

    static async getAllShifts() {
        return prisma.cashierShift.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, role: true } }, payments: true }
        });
    }

    // Mendapatkan laporan setoran harian untuk Admin
    static async getShiftReport(dateStr?: string) {
        // Default today
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        return prisma.cashierShift.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: { user: { select: { name: true } }, payments: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
