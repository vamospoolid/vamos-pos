import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class ProductService {
    static async createProduct(data: { name: string; price: number; stock?: number; category?: string }) {
        const product = await prisma.product.create({
            data
        });

        if (product.stock > 0) {
            await this.logStock(product.id, product.stock, 0, product.stock, 'INITIAL', 'Initial stock on creation');
        }

        return product;
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

        const previousStock = product.stock;
        const updatedProduct = await prisma.product.update({
            where: { id },
            data
        });

        if (data.stock !== undefined && data.stock !== previousStock) {
            await this.logStock(id, updatedProduct.stock - previousStock, previousStock, updatedProduct.stock, 'ADJUSTMENT', 'Manual stock update');
        }

        return updatedProduct;
    }

    static async updateStock(id: string, stockChange: number, type: string = 'ADJUSTMENT', notes?: string) {
        const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const newStock = product.stock + stockChange;
        if (newStock < 0) {
            throw new AppError('Not enough stock available', 400);
        }

        const previousStock = product.stock;
        const result = await prisma.product.update({
            where: { id },
            data: { stock: newStock }
        });

        await this.logStock(id, stockChange, previousStock, newStock, type, notes || (stockChange > 0 ? 'Stock addition' : 'Stock subtraction'));

        return result;
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

    private static async logStock(productId: string, quantity: number, previousStock: number, newStock: number, type: string, notes?: string) {
        return prisma.stockHistory.create({
            data: {
                productId,
                quantity,
                previousStock,
                newStock,
                type,
                notes
            }
        });
    }

    static async getStockLogs(productId?: string) {
        return prisma.stockHistory.findMany({
            where: productId ? { productId } : {},
            include: {
                product: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Limit to last 100 logs for performance
        });
    }
}
