import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Only ADMIN / OWNER can perform system operations
router.get('/export', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.exportBackup);
router.post('/reset', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.resetSystem);
router.post('/seed', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.seedDefaults);
router.post('/fix-tables', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.fixTables);

// Database backup (pg_dump)
// Database backup (pg_dump)
router.post('/backup', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.runBackup);
router.get('/backup/list', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.listBackups);

// Local-First Sync
router.post('/sync-now', authenticate, SystemController.syncNow);
router.get('/unsynced-count', authenticate, SystemController.getUnsyncedCount);
router.post('/sync/receive', SystemController.receiveSyncPayload);

export default router;
