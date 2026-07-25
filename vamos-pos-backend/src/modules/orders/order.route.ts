import { Router } from 'express';
import { addOrder, removeOrder, getKDSOrders, updateKDSStatus } from './order.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/kds', authorizeRoles('ADMIN', 'KASIR'), getKDSOrders);
router.patch('/kds/:id/status', authorizeRoles('ADMIN', 'KASIR'), updateKDSStatus);

router.post('/sessions/:id', authorizeRoles('ADMIN', 'KASIR'), addOrder);
router.delete('/:id', authorizeRoles('ADMIN', 'KASIR'), removeOrder);

export default router;
