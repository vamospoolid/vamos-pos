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

        const products = await prisma.product.findMany({
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

        // Cek pengaturan sistem resep dari venue aktif (yang memiliki meja)
        const venue = await prisma.venue.findFirst({
            where: { deletedAt: null },
            orderBy: { tables: { _count: 'desc' } }
        }) || await prisma.venue.findFirst({ where: { deletedAt: null } });

        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled ?? true;

        return products.map(product => {
            const hasRecipe = Boolean(isRecipeSystemEnabled && product.recipes && product.recipes.length > 0);
            
            if (!hasRecipe) {
                return {
                    ...product,
                    hasRecipe: false,
                    availablePortions: product.stock,
                    isAvailable: product.stock > 0,
                    materialShortage: null
                };
            }

            // Hitung kapasitas porsi dari bahan baku dapur (Bill of Materials)
            let minPortions = Infinity;
            let bottleneckMaterial: string | null = null;

            for (const r of product.recipes) {
                const mat = r.rawMaterial;
                const reqQty = Number(r.quantity || 0);
                if (!mat || reqQty <= 0) continue;

                const curStock = Number(mat.currentStock || 0);
                const portions = Math.floor(curStock / reqQty);

                if (portions < minPortions) {
                    minPortions = portions;
                    bottleneckMaterial = portions <= 0
                        ? `${mat.name} (sisa: ${curStock} ${mat.unit || 'unit'})`
                        : `${mat.name} (sisa: ${curStock} ${mat.unit || 'unit'}, cukup ${portions} porsi)`;
                }
            }

            const availablePortions = minPortions === Infinity ? product.stock : Math.max(0, minPortions);

            return {
                ...product,
                hasRecipe: true,
                availablePortions,
                // Override stock agar semua UI kasir (App.tsx & FnBOrder.tsx) langsung mengenali ketersediaan bahan baku!
                stock: availablePortions,
                isAvailable: availablePortions > 0,
                materialShortage: availablePortions <= 0 ? bottleneckMaterial : null,
                rawStock: product.stock
            };
        });
    }

    static async getProductById(id: string) {
        const product = await prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: {
                recipes: {
                    include: {
                        rawMaterial: true
                    }
                }
            }
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const hasRecipe = Boolean(product.recipes && product.recipes.length > 0);
        if (!hasRecipe) {
            return {
                ...product,
                hasRecipe: false,
                availablePortions: product.stock,
                isAvailable: product.stock > 0,
                materialShortage: null
            };
        }

        let minPortions = Infinity;
        let bottleneckMaterial: string | null = null;
        for (const r of product.recipes) {
            const mat = r.rawMaterial;
            const reqQty = Number(r.quantity || 0);
            if (!mat || reqQty <= 0) continue;
            const curStock = Number(mat.currentStock || 0);
            const portions = Math.floor(curStock / reqQty);
            if (portions < minPortions) {
                minPortions = portions;
                bottleneckMaterial = portions <= 0 ? `${mat.name} habis` : null;
            }
        }
        const availablePortions = minPortions === Infinity ? product.stock : Math.max(0, minPortions);
        return {
            ...product,
            hasRecipe: true,
            availablePortions,
            stock: availablePortions,
            isAvailable: availablePortions > 0,
            materialShortage: availablePortions <= 0 ? bottleneckMaterial : null
        };
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

        // Cek pengaturan sistem resep dari venue aktif (yang memiliki meja)
        const venue = await prisma.venue.findFirst({
            where: { deletedAt: null },
            orderBy: { tables: { _count: 'desc' } }
        }) || await prisma.venue.findFirst({ where: { deletedAt: null } });

        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled ?? true;

        if (isRecipeSystemEnabled && product.recipes && product.recipes.length > 0) {
            for (const ingredient of product.recipes) {
                const required = quantity * ingredient.quantity;
                const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: ingredient.rawMaterialId } });
                if (!rawMaterial || rawMaterial.currentStock < required) {
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
        // Cek pengaturan sistem resep dari venue aktif (di luar tx agar super cepat)
        const venue = await prisma.venue.findFirst({
            where: { deletedAt: null },
            orderBy: { tables: { _count: 'desc' } }
        }) || await prisma.venue.findFirst({ where: { deletedAt: null } });

        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled ?? true;

        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({ 
                where: { id, deletedAt: null },
                include: { recipes: true } 
            });
            if (!product) {
                throw new AppError('Product not found', 404);
            }

            if (isRecipeSystemEnabled && product.recipes && product.recipes.length > 0) {
                // 1. Cek ketersediaan stok semua bahan baku sebelum memotong
                if (stockChange < 0) {
                    for (const ingredient of product.recipes) {
                        const required = Math.abs(stockChange) * ingredient.quantity;
                        const mat = await tx.rawMaterial.findUnique({ where: { id: ingredient.rawMaterialId } });
                        if (!mat || mat.currentStock < required) {
                            throw new AppError(`Bahan baku tidak mencukupi untuk menu ini (${mat?.name || 'Unknown'})`, 400);
                        }
                    }
                }

                // 2. Eksekusi pemotongan/penambahan stok bahan baku secara ATOMIK (Row-lock SQL)
                let remainingPortions = Infinity;

                for (const ingredient of product.recipes) {
                    const materialChange = stockChange * ingredient.quantity;
                    
                    const updatedMat = await tx.rawMaterial.update({
                        where: { id: ingredient.rawMaterialId },
                        data: {
                            currentStock: {
                                increment: materialChange
                            }
                        }
                    });
                    
                    const newMatStock = updatedMat.currentStock;
                    const prevStock = Number(updatedMat.currentStock) - materialChange;

                    await tx.rawMaterialHistory.create({
                        data: {
                            rawMaterialId: updatedMat.id,
                            quantity: materialChange,
                            type: stockChange < 0 ? 'OUT' : (type === 'RETURN' ? 'IN' : 'ADJUSTMENT'),
                            previousStock: prevStock,
                            newStock: newMatStock,
                            notes: notes || `Resep otomatis: ${product.name}`
                        }
                    });

                    // Hitung kapasitas porsi langsung dari hasil atomic update
                    const reqQty = Number(ingredient.quantity || 0);
                    if (reqQty > 0) {
                        const portions = Math.floor(newMatStock / reqQty);
                        if (portions < remainingPortions) remainingPortions = portions;
                    }
                }

                const newProdStock = remainingPortions === Infinity ? 0 : Math.max(0, remainingPortions);

                // Update kolom stock produk agar tersinkronisasi dengan porsi bahan baku dapur
                const updatedProduct = await tx.product.update({
                    where: { id: product.id },
                    data: { stock: newProdStock }
                });

                await tx.stockHistory.create({
                    data: {
                        productId: product.id,
                        quantity: stockChange,
                        previousStock: product.stock,
                        newStock: newProdStock,
                        type,
                        notes: notes || `Resep otomatis: ${product.name}`
                    }
                });
                
                return {
                    ...updatedProduct,
                    hasRecipe: true,
                    availablePortions: newProdStock,
                    stock: newProdStock
                };
            }

            // Logika bawaan (Jika tidak ada resep atau sistem resep dimatikan)
            if (stockChange < 0 && product.stock < Math.abs(stockChange)) {
                throw new AppError('Not enough stock available', 400);
            }

            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    stock: {
                        increment: stockChange
                    }
                }
            });

            const previousStock = product.stock;
            const newStock = updatedProduct.stock;

            await tx.stockHistory.create({
                data: {
                    productId: id,
                    quantity: stockChange,
                    previousStock,
                    newStock,
                    type,
                    notes: notes || (stockChange > 0 ? 'Stock addition' : 'Stock subtraction')
                }
            });

            return updatedProduct;
        }, { maxWait: 10000, timeout: 20000 });

        // Broadcast realtime stock update via Socket.IO
        try {
            const { getIO } = await import('../../socket');
            getIO().emit('stock:updated', { productId: id, stock: (result as any)?.stock });
            getIO().emit('products:updated');
        } catch (e) {
            // Non-blocking socket error
        }

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
