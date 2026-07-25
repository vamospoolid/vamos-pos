import { Router } from 'express';
import { getMenu, createOrder } from './qr.controller';

const router = Router();

router.get('/menu/:tableId', getMenu);
router.post('/order/:tableId', createOrder);

export default router;
