import { Router } from 'express';
import { addOrder, removeOrder, getKDSOrders, updateKDSStatus, serveSessionKDS, revertSessionKDS } from './order.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/kds', authorizeRoles('ADMIN', 'KASIR'), getKDSOrders);
router.patch('/kds/:id/status', authorizeRoles('ADMIN', 'KASIR'), updateKDSStatus);
router.patch('/kds/session/:sessionId/serve-all', authorizeRoles('ADMIN', 'KASIR'), serveSessionKDS);
router.patch('/kds/session/:sessionId/revert', authorizeRoles('ADMIN', 'KASIR'), revertSessionKDS);

router.post('/sessions/:id', authorizeRoles('ADMIN', 'KASIR'), addOrder);
router.delete('/:id', authorizeRoles('ADMIN', 'KASIR'), removeOrder);

export default router;
