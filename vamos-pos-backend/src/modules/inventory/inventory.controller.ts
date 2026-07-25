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
      const { name, unit, currentStock, costPerUnit, minStockAlert } = req.body;
      const data = await inventoryService.createRawMaterial({
        name, 
        unit: unit as UnitType, 
        currentStock: Number(currentStock), 
        costPerUnit: Number(costPerUnit), 
        minStockAlert: Number(minStockAlert)
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRawMaterial(req: Request, res: Response) {
    try {
      const { name, unit, costPerUnit, minStockAlert } = req.body;
      const data = await inventoryService.updateRawMaterial(req.params.id, {
        name,
        unit: unit as UnitType,
        costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : undefined,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : undefined
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
}

export const inventoryController = new InventoryController();
