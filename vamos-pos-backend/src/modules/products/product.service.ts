import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class ProductService {
    static async createProduct(data: { name: string; price: number; stock?: number; category?: string }) {
        return prisma.product.create({
            data
        });
    }

    static async getProducts(category?: string) {
        const whereClause: any = { deletedAt: null };
        if (category) {
            whereClause.category = category;
        }

        return prisma.product.findMany({
            where: whereClause,
            orderBy: {
                name: 'asc'
            }
        });
    }

    static async getProductById(id: string) {
        const product = await prisma.product.findFirst({
            where: { id, deletedAt: null }
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        return product;
    }

    static async updateProduct(id: string, data: { name?: string; price?: number; stock?: number; category?: string }) {
        const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        return prisma.product.update({
            where: { id },
            data
        });
    }

    static async updateStock(id: string, stockChange: number) {
        const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const newStock = product.stock + stockChange;
        if (newStock < 0) {
            throw new AppError('Not enough stock available', 400);
        }

        return prisma.product.update({
            where: { id },
            data: { stock: newStock }
        });
    }

    static async deleteProduct(id: string) {
        const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        return prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
