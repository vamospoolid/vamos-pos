import { Router } from 'express';
import { inventoryController } from './inventory.controller';

const router = Router();

router.get('/raw-materials', inventoryController.getRawMaterials);
router.post('/raw-materials', inventoryController.createRawMaterial);
router.get('/raw-materials/:id', inventoryController.getRawMaterialById);
router.put('/raw-materials/:id', inventoryController.updateRawMaterial);
router.delete('/raw-materials/:id', inventoryController.deleteRawMaterial);
router.post('/raw-materials/:id/adjust', inventoryController.adjustStock);
router.post('/raw-materials/:id/restock', inventoryController.restockRawMaterial);
router.get('/history', inventoryController.getRawMaterialHistory);

router.get('/products/:productId/recipe', inventoryController.getRecipe);
router.post('/products/:productId/recipe', inventoryController.saveRecipe);

// Starter Pack Importer & HPP Summary
router.post('/starter-pack', inventoryController.importStarterPack);
router.get('/hpp-summary', inventoryController.getProductsHppSummary);

// Waste & Spoilage Logs
router.get('/waste', inventoryController.getWasteLogs);
router.post('/waste', inventoryController.recordWasteLog);

// Stock Opname (Audit Fisik vs Sistem)
router.get('/stock-opname', inventoryController.getStockOpnames);
router.get('/stock-opname/:id', inventoryController.getStockOpnameById);
router.post('/stock-opname', inventoryController.createStockOpname);

export default router;
