import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { UnitType } from '@prisma/client';

export class InventoryController {
  async getRawMaterials(req: Request, res: Response) {
    try {
      const data = await inventoryService.getRawMaterials();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRawMaterialById(req: Request, res: Response) {
    try {
      const data = await inventoryService.getRawMaterialById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createRawMaterial(req: Request, res: Response) {
    try {
      const { name, unit, currentStock, costPerUnit, minStockAlert, purchaseUnit, conversionRatio, lastPurchasePrice } = req.body;
      const data = await inventoryService.createRawMaterial({
        name, 
        unit: unit as UnitType, 
        currentStock: Number(currentStock), 
        costPerUnit: Number(costPerUnit), 
        minStockAlert: Number(minStockAlert),
        purchaseUnit,
        conversionRatio: conversionRatio !== undefined ? Number(conversionRatio) : undefined,
        lastPurchasePrice: lastPurchasePrice !== undefined ? Number(lastPurchasePrice) : undefined
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRawMaterial(req: Request, res: Response) {
    try {
      const { name, unit, costPerUnit, minStockAlert, purchaseUnit, conversionRatio, lastPurchasePrice } = req.body;
      const data = await inventoryService.updateRawMaterial(req.params.id, {
        name,
        unit: unit as UnitType,
        costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : undefined,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : undefined,
        purchaseUnit,
        conversionRatio: conversionRatio !== undefined ? Number(conversionRatio) : undefined,
        lastPurchasePrice: lastPurchasePrice !== undefined ? Number(lastPurchasePrice) : undefined
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async restockRawMaterial(req: Request, res: Response) {
    try {
      const { purchaseQty, purchasePricePerUnit, notes, useMovingAverage } = req.body;
      if (!purchaseQty || Number(purchaseQty) <= 0) {
        return res.status(400).json({ error: 'purchaseQty wajib lebih besar dari 0' });
      }
      const data = await inventoryService.restockRawMaterial(req.params.id, {
        purchaseQty: Number(purchaseQty),
        purchasePricePerUnit: purchasePricePerUnit !== undefined ? Number(purchasePricePerUnit) : undefined,
        notes,
        useMovingAverage: useMovingAverage !== false
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteRawMaterial(req: Request, res: Response) {
    try {
      await inventoryService.deleteRawMaterial(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async adjustStock(req: Request, res: Response) {
    try {
      const { newStock, notes } = req.body;
      const data = await inventoryService.adjustStock(req.params.id, Number(newStock), notes);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRecipe(req: Request, res: Response) {
    try {
      const data = await inventoryService.getRecipeByProductId(req.params.productId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async saveRecipe(req: Request, res: Response) {
    try {
      const { ingredients } = req.body;
      const data = await inventoryService.saveRecipe(req.params.productId, ingredients);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async importStarterPack(req: Request, res: Response) {
    try {
      const result = await inventoryService.importStarterPack();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWasteLogs(req: Request, res: Response) {
    try {
      const data = await inventoryService.getWasteLogs();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async recordWasteLog(req: Request, res: Response) {
    try {
      const { rawMaterialId, quantity, reason, notes, recordedBy } = req.body;
      if (!rawMaterialId || !quantity || !reason) {
        return res.status(400).json({ error: 'rawMaterialId, quantity, dan reason wajib diisi' });
      }

      const data = await inventoryService.recordWasteLog({
        rawMaterialId,
        quantity: Number(quantity),
        reason,
        notes,
        recordedBy: recordedBy || (req as any).user?.name || 'Kasir/Staf'
      });
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProductsHppSummary(req: Request, res: Response) {
    try {
      const data = await inventoryService.getProductsHppSummary();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStockOpnames(req: Request, res: Response) {
    try {
      const data = await inventoryService.getStockOpnames();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStockOpnameById(req: Request, res: Response) {
    try {
      const data = await inventoryService.getStockOpnameById(req.params.id);
      res.json(data);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async createStockOpname(req: Request, res: Response) {
    try {
      const { conductedBy, notes, items, applyAdjustment } = req.body;
      const data = await inventoryService.createStockOpname({
        conductedBy: conductedBy || (req as any).user?.name || 'Kasir/Staf Bar',
        notes,
        items,
        applyAdjustment: applyAdjustment !== false
      });
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRawMaterialHistory(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 100;
      const data = await inventoryService.getRawMaterialHistory(limit);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const inventoryController = new InventoryController();
