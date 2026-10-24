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

    static async getActiveShiftSummary(userId: string) {
        const shift = await prisma.cashierShift.findFirst({
            where: { userId, status: 'OPEN' },
            include: {
                user: { select: { name: true, role: true } },
                payments: true
            }
        });

        if (!shift) {
            return null;
        }

        return this.calculateShiftSummary(shift);
    }

    static async getShiftSummaryById(shiftId: string) {
        const shift = await prisma.cashierShift.findUnique({
            where: { id: shiftId },
            include: {
                user: { select: { name: true, role: true } },
                payments: true
            }
        });

        if (!shift) {
            throw new AppError('Shift tidak ditemukan.', 404);
        }

        return this.calculateShiftSummary(shift);
    }

    private static async calculateShiftSummary(shift: any) {
        const successfulPayments = shift.payments.filter((p: any) => p.status === 'SUCCESS');

        const cashPayments = successfulPayments.filter((p: any) => p.method === 'CASH');
        const qrisPayments = successfulPayments.filter((p: any) => p.method === 'QRIS');
        const cardPayments = successfulPayments.filter((p: any) => p.method === 'CARD' || p.method === 'EDC');
        const transferPayments = successfulPayments.filter((p: any) => p.method === 'TRANSFER');

        const cashSales = cashPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const qrisSales = qrisPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const cardSales = cardPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const transferSales = transferPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const totalSales = cashSales + qrisSales + cardSales + transferSales;

        const expenses = await prisma.expense.findMany({
            where: { shiftId: shift.id, deletedAt: null },
            orderBy: { createdAt: 'asc' }
        });

        const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const expectedCash = shift.startingCash + cashSales - totalExpenseAmount;

        const now = shift.endTime || new Date();
        const durationMinutes = Math.round((new Date(now).getTime() - new Date(shift.startTime).getTime()) / 60000);

        let parsedBreakdown = null;
        if (shift.cashBreakdown) {
            try {
                parsedBreakdown = JSON.parse(shift.cashBreakdown);
            } catch (e) {
                parsedBreakdown = null;
            }
        }

        return {
            id: shift.id,
            userId: shift.userId,
            cashierName: shift.user?.name || 'Kasir',
            status: shift.status,
            startTime: shift.startTime,
            endTime: shift.endTime,
            durationMinutes,
            startingCash: shift.startingCash,
            salesSummary: {
                cashSales,
                qrisSales,
                cardSales,
                transferSales,
                totalSales,
                transactionCount: successfulPayments.length
            },
            expensesSummary: {
                totalExpenseAmount,
                expensesList: expenses
            },
            expectedCash,
            endingCashActual: shift.endingCashActual,
            cashDifference: shift.cashDifference ?? (shift.endingCashActual !== null ? shift.endingCashActual - expectedCash : null),
            cashBreakdown: parsedBreakdown,
            differenceReason: shift.differenceReason,
            notes: shift.notes
        };
    }

    static async closeShift(
        userId: string,
        endingCashActual: number,
        notes?: string,
        cashBreakdown?: Record<string, number>,
        differenceReason?: string
    ) {
        const shift = await prisma.cashierShift.findFirst({
            where: { userId, status: 'OPEN' },
            include: { payments: true }
        });

        if (!shift) {
            throw new AppError('Anda tidak mempunyai shift yang sedang aktif.', 400);
        }

        const endTime = new Date();

        // Hitung ekspektasi cash dari pembayaran tunai
        const expectedCashPayments = shift.payments
            .filter((p: any) => p.method === 'CASH' && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const expectedQris = shift.payments
            .filter((p: any) => p.method === 'QRIS' && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const expectedCard = shift.payments
            .filter((p: any) => (p.method === 'CARD' || p.method === 'EDC') && p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        // Hitung total pengeluaran tunai (Expense) selama shift ini
        const totalExpenses = await prisma.expense.aggregate({
            where: { shiftId: shift.id, deletedAt: null },
            _sum: { amount: true }
        });

        const totalExpenseAmount = totalExpenses?._sum?.amount || 0;
        const expectedCash = shift.startingCash + expectedCashPayments - totalExpenseAmount;
        const cashDifference = endingCashActual - expectedCash;

        const updatedShift = await prisma.cashierShift.update({
            where: { id: shift.id },
            data: {
                status: 'CLOSED',
                endTime,
                endingCashActual,
                expectedCash,
                expectedQris,
                expectedCard,
                cashBreakdown: cashBreakdown ? JSON.stringify(cashBreakdown) : null,
                cashDifference,
                differenceReason: differenceReason || null,
                notes: notes || shift.notes
            }
        });

        await AuditService.log(userId, 'SHIFT_CLOSE', 'CashierShift', {
            shiftId: shift.id,
            expectedCash,
            endingCashActual,
            cashDifference
        });

        return this.getShiftSummaryById(updatedShift.id);
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
