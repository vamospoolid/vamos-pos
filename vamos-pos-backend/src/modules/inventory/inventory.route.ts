import { Router } from 'express';
import { inventoryController } from './inventory.controller';

const router = Router();

router.get('/raw-materials', inventoryController.getRawMaterials);
router.post('/raw-materials', inventoryController.createRawMaterial);
router.get('/raw-materials/:id', inventoryController.getRawMaterialById);
router.put('/raw-materials/:id', inventoryController.updateRawMaterial);
router.delete('/raw-materials/:id', inventoryController.deleteRawMaterial);
router.post('/raw-materials/:id/adjust', inventoryController.adjustStock);

router.get('/products/:productId/recipe', inventoryController.getRecipe);
router.post('/products/:productId/recipe', inventoryController.saveRecipe);

export default router;
