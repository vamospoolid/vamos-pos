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
            include: {
                recipes: {
                    include: {
                        rawMaterial: true
                    }
                }
            },
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

    static async validateStock(id: string, quantity: number) {
        const product = await prisma.product.findFirst({ 
            where: { id, deletedAt: null },
            include: { recipes: true } 
        });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const venue = await prisma.venue.findFirst();
        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled || false;

        if (isRecipeSystemEnabled && product.recipes && product.recipes.length > 0) {
            for (const ingredient of product.recipes) {
                const materialChange = -quantity * ingredient.quantity;
                const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: ingredient.rawMaterialId } });
                if (!rawMaterial || rawMaterial.currentStock + materialChange < 0) {
                    throw new AppError(`Bahan baku tidak mencukupi untuk menu ini (${rawMaterial?.name || 'Unknown'})`, 400);
                }
            }
            return true;
        }

        if (product.stock < quantity) {
            throw new AppError('Not enough stock available', 400);
        }
        return true;
    }

    static async updateStock(id: string, stockChange: number, type: string = 'ADJUSTMENT', notes?: string) {
        const product = await prisma.product.findFirst({ 
            where: { id, deletedAt: null },
            include: { recipes: true } 
        });
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        // Cek pengaturan sistem resep
        const venue = await prisma.venue.findFirst();
        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled || false;

        if (isRecipeSystemEnabled && product.recipes && product.recipes.length > 0) {
            // Cek ketersediaan stok semua bahan baku sebelum memotong
            if (stockChange < 0) {
                for (const ingredient of product.recipes) {
                    const materialChange = stockChange * ingredient.quantity;
                    const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: ingredient.rawMaterialId } });
                    if (!rawMaterial || rawMaterial.currentStock + materialChange < 0) {
                        throw new AppError(`Bahan baku tidak mencukupi untuk menu ini (${rawMaterial?.name || 'Unknown'})`, 400);
                    }
                }
            }

            // Eksekusi pemotongan/penambahan stok bahan baku
            for (const ingredient of product.recipes) {
                const materialChange = stockChange * ingredient.quantity;
                const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: ingredient.rawMaterialId } });
                
                if (rawMaterial) {
                    const newMatStock = rawMaterial.currentStock + materialChange;
                    
                    await prisma.rawMaterial.update({
                        where: { id: rawMaterial.id },
                        data: { currentStock: newMatStock }
                    });
                    
                    await prisma.rawMaterialHistory.create({
                        data: {
                            rawMaterialId: rawMaterial.id,
                            quantity: materialChange,
                            type: stockChange < 0 ? 'OUT' : 'IN',
                            previousStock: rawMaterial.currentStock,
                            newStock: newMatStock,
                            notes: notes || `Resep otomatis: ${product.name}`
                        }
                    });
                }
            }
            
            return product;
        }

        // Logika bawaan (Jika tidak ada resep atau sistem resep dimatikan)
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
