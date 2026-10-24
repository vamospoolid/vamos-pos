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

    static async getDailyAttendance(dateStr?: string) {
        let startOfDay: Date;
        let endOfDay: Date;

        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-').map(Number);
            startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
            endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else if (dateStr && !isNaN(new Date(dateStr).getTime())) {
            const d = new Date(dateStr);
            startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
            endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        } else {
            const now = new Date();
            startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }

        return prisma.attendance.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                        phone: true,
                        avatarUrl: true,
                        shift: true
                    }
                },
                shift: true
            },
            orderBy: { checkIn: 'desc' }
        });
    }
}
