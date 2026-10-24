import { PrismaClient, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryService {
  // Raw Material CRUD
  async getRawMaterials() {
    return prisma.rawMaterial.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getRawMaterialById(id: string) {
    return prisma.rawMaterial.findUnique({ where: { id } });
  }

  async createRawMaterial(data: {
    name: string;
    unit: UnitType;
    currentStock?: number;
    costPerUnit: number;
    minStockAlert?: number;
    purchaseUnit?: string;
    conversionRatio?: number;
    lastPurchasePrice?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.create({
        data: {
          name: data.name,
          unit: data.unit,
          currentStock: data.currentStock || 0,
          costPerUnit: data.costPerUnit,
          minStockAlert: data.minStockAlert || 0,
          purchaseUnit: data.purchaseUnit,
          conversionRatio: data.conversionRatio || 1,
          lastPurchasePrice: data.lastPurchasePrice || 0,
        }
      });

      if (data.currentStock && data.currentStock > 0) {
        await tx.rawMaterialHistory.create({
          data: {
            rawMaterialId: material.id,
            quantity: data.currentStock,
            type: 'INITIAL',
            previousStock: 0,
            newStock: data.currentStock,
            notes: 'Saldo Awal Bahan Baku (Initial Stock)'
          }
        });
      }

      return material;
    });
  }

  async updateRawMaterial(id: string, data: Partial<{
    name: string;
    unit: UnitType;
    costPerUnit: number;
    minStockAlert: number;
    purchaseUnit: string;
    conversionRatio: number;
    lastPurchasePrice: number;
  }>) {
    return prisma.rawMaterial.update({
      where: { id },
      data,
    });
  }

  async deleteRawMaterial(id: string) {
    return prisma.rawMaterial.delete({
      where: { id }
    });
  }

  // Stock Opname / Adjustment
  async adjustStock(id: string, newStock: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.findUnique({ where: { id } });
      if (!material) throw new Error('RawMaterial not found');

      const difference = newStock - material.currentStock;
      
      const updated = await tx.rawMaterial.update({
        where: { id },
        data: { currentStock: newStock }
      });

      await tx.rawMaterialHistory.create({
        data: {
          rawMaterialId: id,
          quantity: difference,
          type: difference > 0 ? 'IN' : 'ADJUSTMENT',
          previousStock: material.currentStock,
          newStock,
          notes: notes || 'Manual adjustment'
        }
      });

      return updated;
    });
  }

  // Kulakan / Restock Bahan Baku (dengan Satuan Pembelian & Moving Average Costing)
  async restockRawMaterial(id: string, data: {
    purchaseQty: number;
    purchasePricePerUnit?: number;
    notes?: string;
    useMovingAverage?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.findUnique({ where: { id } });
      if (!material) throw new Error('Bahan baku tidak ditemukan');

      const conversionRatio = material.conversionRatio || 1;
      const addedAtomicStock = data.purchaseQty * conversionRatio;
      const newStock = material.currentStock + addedAtomicStock;

      let newCostPerUnit = material.costPerUnit;

      if (data.purchasePricePerUnit !== undefined && data.purchasePricePerUnit > 0) {
        const incomingCostPerAtomic = data.purchasePricePerUnit / conversionRatio;
        if (material.currentStock > 0 && data.useMovingAverage !== false) {
          const oldVal = material.currentStock * material.costPerUnit;
          const newVal = addedAtomicStock * incomingCostPerAtomic;
          newCostPerUnit = (oldVal + newVal) / newStock;
        } else {
          newCostPerUnit = incomingCostPerAtomic;
        }
      }

      const updated = await tx.rawMaterial.update({
        where: { id },
        data: {
          currentStock: newStock,
          costPerUnit: Math.round(newCostPerUnit * 100) / 100,
          lastPurchasePrice: data.purchasePricePerUnit || material.lastPurchasePrice
        }
      });

      await tx.rawMaterialHistory.create({
        data: {
          rawMaterialId: id,
          quantity: addedAtomicStock,
          type: 'IN',
          previousStock: material.currentStock,
          newStock,
          notes: data.notes || `Kulakan: +${data.purchaseQty} ${material.purchaseUnit || material.unit} (+${addedAtomicStock} ${material.unit})`
        }
      });

      return updated;
    });
  }

  // Recipe Management
  async getRecipeByProductId(productId: string) {
    return prisma.recipeIngredient.findMany({
      where: { productId },
      include: { rawMaterial: true }
    });
  }

  async saveRecipe(productId: string, ingredients: { rawMaterialId: string; quantity: number }[]) {
    return prisma.$transaction(async (tx) => {
      // Delete existing recipe for this product
      await tx.recipeIngredient.deleteMany({
        where: { productId }
      });

      if (ingredients.length === 0) return [];

      // Insert new recipe
      const data = ingredients.map(i => ({
        productId,
        rawMaterialId: i.rawMaterialId,
        quantity: i.quantity
      }));

      await tx.recipeIngredient.createMany({
        data
      });

      return tx.recipeIngredient.findMany({
        where: { productId },
        include: { rawMaterial: true }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STARTER PACK IMPORTER (1-Click Setup)
  // ─────────────────────────────────────────────────────────────────────────
  async importStarterPack() {
    const { STARTER_PACK_VAMOS_POOL_CAFE } = await import('../../utils/starterPacksData');

    return prisma.$transaction(async (tx) => {
      // 1. Enable Recipe System on Venue
      const venue = await tx.venue.findFirst();
      if (venue) {
        await tx.venue.update({
          where: { id: venue.id },
          data: { isRecipeSystemEnabled: true }
        });
      }

      // 2. Insert or update Raw Materials
      const rawMaterialMap = new Map<string, string>(); // name -> id

      for (const item of STARTER_PACK_VAMOS_POOL_CAFE.rawMaterials) {
        let existing = await tx.rawMaterial.findFirst({
          where: { name: item.name }
        });

        if (existing) {
          await tx.rawMaterial.update({
            where: { id: existing.id },
            data: {
              costPerUnit: item.costPerUnit,
              minStockAlert: item.minStockAlert,
              purchaseUnit: item.purchaseUnit,
              conversionRatio: item.conversionRatio,
              lastPurchasePrice: item.lastPurchasePrice
            }
          });
        } else {
          existing = await tx.rawMaterial.create({
            data: {
              name: item.name,
              unit: item.unit,
              costPerUnit: item.costPerUnit,
              currentStock: item.currentStock,
              minStockAlert: item.minStockAlert,
              purchaseUnit: item.purchaseUnit,
              conversionRatio: item.conversionRatio,
              lastPurchasePrice: item.lastPurchasePrice
            }
          });

          await tx.rawMaterialHistory.create({
            data: {
              rawMaterialId: existing.id,
              quantity: item.currentStock,
              type: 'INITIAL',
              previousStock: 0,
              newStock: item.currentStock,
              notes: 'Starter Pack Import Initial Stock'
            }
          });
        }
        rawMaterialMap.set(item.name, existing.id);
      }

      // 3. Insert or update Products with Recipes
      let createdProductsCount = 0;
      let createdRecipesCount = 0;

      for (const prodItem of STARTER_PACK_VAMOS_POOL_CAFE.productsWithRecipes) {
        let product = await tx.product.findFirst({
          where: { name: prodItem.name, deletedAt: null }
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              name: prodItem.name,
              category: prodItem.category,
              price: prodItem.price,
              stock: 999
            }
          });
          createdProductsCount++;
        }

        // Setup Recipe
        await tx.recipeIngredient.deleteMany({
          where: { productId: product.id }
        });

        for (const ing of prodItem.ingredients) {
          const rawId = rawMaterialMap.get(ing.rawMaterialName);
          if (rawId) {
            await tx.recipeIngredient.create({
              data: {
                productId: product.id,
                rawMaterialId: rawId,
                quantity: ing.quantity
              }
            });
            createdRecipesCount++;
          }
        }
      }

      return {
        success: true,
        message: 'Starter Pack Biliar & Cafe berhasil diimpor!',
        rawMaterialsImported: STARTER_PACK_VAMOS_POOL_CAFE.rawMaterials.length,
        productsCount: createdProductsCount,
        recipesCount: createdRecipesCount
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WASTE & SPOILAGE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  async getWasteLogs() {
    return prisma.wasteLog.findMany({
      include: {
        rawMaterial: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async recordWasteLog(data: {
    rawMaterialId: string;
    quantity: number;
    reason: string;
    notes?: string;
    recordedBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.findUnique({
        where: { id: data.rawMaterialId }
      });
      if (!material) throw new Error('Bahan baku tidak ditemukan');

      if (material.currentStock < data.quantity) {
        throw new Error(`Stok saat ini (${material.currentStock} ${material.unit}) tidak mencukupi untuk dicatat rusak (${data.quantity} ${material.unit})`);
      }

      const costLoss = data.quantity * material.costPerUnit;
      const newStock = material.currentStock - data.quantity;

      // 1. Kurangi stok bahan baku
      await tx.rawMaterial.update({
        where: { id: material.id },
        data: { currentStock: newStock }
      });

      // 2. Catat riwayat stok bahan baku (SPOILAGE)
      await tx.rawMaterialHistory.create({
        data: {
          rawMaterialId: material.id,
          quantity: -data.quantity,
          type: 'SPOILAGE',
          previousStock: material.currentStock,
          newStock,
          notes: `Waste/Basi: ${data.reason} - ${data.notes || ''}`
        }
      });

      // 3. Catat di tabel WasteLog
      return tx.wasteLog.create({
        data: {
          rawMaterialId: material.id,
          quantity: data.quantity,
          costLoss,
          reason: data.reason,
          notes: data.notes,
          recordedBy: data.recordedBy || 'Kasir/Staf'
        },
        include: {
          rawMaterial: true
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HPP & GROSS PROFIT MARGIN ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────
  async getProductsHppSummary() {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        recipes: {
          include: {
            rawMaterial: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return products.map(prod => {
      let hpp = 0;
      const ingredientsDetail: any[] = [];

      if (prod.recipes && prod.recipes.length > 0) {
        for (const r of prod.recipes) {
          const cost = (r.quantity || 0) * (r.rawMaterial?.costPerUnit || 0);
          hpp += cost;
          ingredientsDetail.push({
            name: r.rawMaterial?.name,
            quantity: r.quantity,
            unit: r.rawMaterial?.unit,
            costPerUnit: r.rawMaterial?.costPerUnit,
            subtotalCost: cost
          });
        }
      }

      const sellingPrice = prod.price || 0;
      const grossProfit = sellingPrice - hpp;
      const marginPercent = sellingPrice > 0 ? Number(((grossProfit / sellingPrice) * 100).toFixed(1)) : 0;

      return {
        id: prod.id,
        name: prod.name,
        category: prod.category,
        sellingPrice,
        hpp: Math.round(hpp),
        grossProfit: Math.round(grossProfit),
        marginPercent,
        hasRecipe: prod.recipes.length > 0,
        ingredients: ingredientsDetail
      };
    });
  }

  // Stock Opname
  async getStockOpnames() {
    return prisma.stockOpname.findMany({
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: {
            rawMaterial: true
          }
        }
      }
    });
  }

  async getStockOpnameById(id: string) {
    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            rawMaterial: true
          }
        }
      }
    });
    if (!opname) throw new Error('Data Stock Opname tidak ditemukan');
    return opname;
  }

  async createStockOpname(data: {
    conductedBy?: string;
    notes?: string;
    items: {
      rawMaterialId: string;
      physicalStock: number;
      notes?: string;
    }[];
    applyAdjustment?: boolean;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Item stock opname tidak boleh kosong');
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const opnameNumber = `OPN-${dateStr}-${timeStr}`;

    return prisma.$transaction(async (tx) => {
      let totalVarianceCost = 0;
      const preparedItems: {
        rawMaterialId: string;
        systemStock: number;
        physicalStock: number;
        difference: number;
        costPerUnit: number;
        costDifference: number;
        notes?: string;
      }[] = [];

      for (const item of data.items) {
        const material = await tx.rawMaterial.findUnique({
          where: { id: item.rawMaterialId }
        });
        if (!material) continue;

        const systemStock = material.currentStock;
        const physicalStock = Number(item.physicalStock);
        const difference = physicalStock - systemStock;
        const costPerUnit = material.costPerUnit || 0;
        const costDifference = difference * costPerUnit;

        totalVarianceCost += costDifference;

        preparedItems.push({
          rawMaterialId: material.id,
          systemStock,
          physicalStock,
          difference,
          costPerUnit,
          costDifference,
          notes: item.notes
        });

        // If applyAdjustment is requested (default true), synchronize system currentStock to physicalStock
        if (data.applyAdjustment !== false) {
          await tx.rawMaterial.update({
            where: { id: material.id },
            data: { currentStock: physicalStock }
          });

          if (difference !== 0) {
            await tx.rawMaterialHistory.create({
              data: {
                rawMaterialId: material.id,
                quantity: Math.abs(difference),
                type: difference < 0 ? 'SPOILAGE' : 'ADJUSTMENT',
                previousStock: systemStock,
                newStock: physicalStock,
                notes: `Stock Opname #${opnameNumber}: ${difference < 0 ? 'Short' : 'Surplus'} (${difference > 0 ? '+' : ''}${difference} ${material.unit})`
              }
            });
          }
        }
      }

      const opname = await tx.stockOpname.create({
        data: {
          opnameNumber,
          date: now,
          conductedBy: data.conductedBy || 'Staf Kasir/Bar',
          notes: data.notes,
          status: data.applyAdjustment !== false ? 'COMPLETED' : 'DRAFT',
          totalVarianceCost: Math.round(totalVarianceCost * 100) / 100,
          items: {
            create: preparedItems
          }
        },
        include: {
          items: {
            include: {
              rawMaterial: true
            }
          }
        }
      });

      return opname;
    });
  }

  async getRawMaterialHistory(limit: number = 100) {
    return prisma.rawMaterialHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        rawMaterial: true
      }
    });
  }
}

export const inventoryService = new InventoryService();
