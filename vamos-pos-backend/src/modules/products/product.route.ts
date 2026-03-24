import { Router } from 'express';
import { ProductController } from './product.controller';

const router = Router();

router.post('/', ProductController.createProduct);
router.get('/', ProductController.getProducts);
router.get('/stock-logs', ProductController.getStockLogs);
router.get('/:id', ProductController.getProductById);
router.put('/:id', ProductController.updateProduct);
router.patch('/:id/stock', ProductController.updateStock);
router.delete('/:id', ProductController.deleteProduct);

export default router;
