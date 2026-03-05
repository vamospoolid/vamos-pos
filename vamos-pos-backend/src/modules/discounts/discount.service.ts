import { prisma } from '../../database/db';

export class DiscountService {
    static async create(data: { name: string; type: string; value: number; description?: string }) {
        return prisma.discountCategory.create({ data });
    }

    static async getAll() {
        return prisma.discountCategory.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
    }

    static async update(id: string, data: any) {
        return prisma.discountCategory.update({
            where: { id },
            data
        });
    }

    static async delete(id: string) {
        return prisma.discountCategory.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false }
        });
    }
}
