import { Router } from 'express';
import { addOrder, removeOrder } from './order.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/sessions/:id', authorizeRoles('ADMIN', 'KASIR'), addOrder);
router.delete('/:id', authorizeRoles('ADMIN', 'KASIR'), removeOrder);

export default router;
