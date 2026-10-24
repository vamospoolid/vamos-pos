import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class EmployeeService {
    static async createEmployee(data: { name: string; position: string; phone?: string; email?: string; salary?: number; joinDate?: Date; status?: string; shiftId?: string; pinCode?: string; jobdesk?: string }) {
        return prisma.employee.create({
            data,
            include: { shift: true }
        });
    }

    static async getEmployees() {
        return prisma.employee.findMany({
            where: { deletedAt: null },
            include: { shift: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getEmployeeById(id: string) {
        const employee = await prisma.employee.findFirst({
            where: { id, deletedAt: null },
            include: { shift: true }
        });
        if (!employee) throw new AppError('Employee not found', 404);
        return employee;
    }

    static async updateEmployee(id: string, data: Partial<{ name: string; position: string; phone: string; email: string; salary: number; status: string; shiftId: string; pinCode: string; jobdesk: string }>) {
        const employee = await prisma.employee.findFirst({ where: { id, deletedAt: null } });
        if (!employee) throw new AppError('Employee not found', 404);

        return prisma.employee.update({
            where: { id },
            data,
            include: { shift: true }
        });
    }

    static async deleteEmployee(id: string) {
        const employee = await prisma.employee.findFirst({ where: { id, deletedAt: null } });
        if (!employee) throw new AppError('Employee not found', 404);

        return prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'TERMINATED' }
        });
    }
}
