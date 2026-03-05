import { Router } from 'express';
import { DiscountController } from './discount.controller';

const router = Router();

router.post('/', DiscountController.create);
router.get('/', DiscountController.getAll);
router.put('/:id', DiscountController.update);
router.delete('/:id', DiscountController.delete);

export default router;
