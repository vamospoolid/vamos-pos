import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class AttendanceService {
    static async recordCheckIn(data: { employeeId: string; date?: string; notes?: string }) {
        const today = data.date ? new Date(data.date) : new Date();
        today.setHours(0, 0, 0, 0);

        const activeEmployee = await prisma.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null }
        });
        if (!activeEmployee) throw new AppError('Employee not found or inactive', 404);

        const existing = await prisma.attendance.findFirst({
            where: {
                employeeId: data.employeeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (existing) {
            if (existing.checkIn && !existing.checkOut) {
                // Return existing to let user checkout
                return existing;
            }
            throw new AppError('Attendance record already exists for today', 400);
        }

        return prisma.attendance.create({
            data: {
                employeeId: data.employeeId,
                date: new Date(),
                checkIn: new Date(),
                status: 'PRESENT',
                notes: data.notes
            }
        });
    }

    static async recordCheckOut(id: string, notes?: string) {
        const existing = await prisma.attendance.findUnique({ where: { id } });
        if (!existing) throw new AppError('Attendance record not found', 404);
        if (existing.checkOut) throw new AppError('Already checked out', 400);

        return prisma.attendance.update({
            where: { id },
            data: {
                checkOut: new Date(),
                notes: notes ? `${existing.notes ? existing.notes + ' | ' : ''}Out: ${notes}` : existing.notes
            }
        });
    }

    static async getDailyAttendance(date: string) {
        let targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            targetDate = new Date(); // fallback today
        }
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

        return prisma.attendance.findMany({
            where: {
                date: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            include: {
                employee: {
                    select: { name: true, position: true }
                }
            },
            orderBy: { checkIn: 'asc' }
        });
    }
}
