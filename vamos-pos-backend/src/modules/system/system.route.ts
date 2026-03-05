import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Only ADMIN / OWNER can perform system operations
router.get('/export', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.exportBackup);
router.post('/reset', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.resetSystem);
router.post('/seed', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.seedDefaults);
router.post('/fix-tables', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.fixTables);

export default router;
