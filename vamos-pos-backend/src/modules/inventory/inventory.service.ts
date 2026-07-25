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
  }) {
    return prisma.rawMaterial.create({
      data: {
        name: data.name,
        unit: data.unit,
        currentStock: data.currentStock || 0,
        costPerUnit: data.costPerUnit,
        minStockAlert: data.minStockAlert || 0,
      }
    });
  }

  async updateRawMaterial(id: string, data: Partial<{
    name: string;
    unit: UnitType;
    costPerUnit: number;
    minStockAlert: number;
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
}

export const inventoryService = new InventoryService();
