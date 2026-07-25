import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate, localOrAuthenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Only ADMIN / OWNER can perform system operations
router.get('/export', localOrAuthenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.exportBackup);
router.post('/reset', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.resetSystem);
router.post('/seed', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.seedDefaults);
router.post('/fix-tables', authenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.fixTables);
router.post('/print/test', localOrAuthenticate, SystemController.testPrinter);

// Database backup – allow offline restore on local Electron (IS_LOCAL_ELECTRON=true)
router.post('/backup', localOrAuthenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.runBackup);
router.get('/backup/list', localOrAuthenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.listBackups);
router.post('/backup/restore', localOrAuthenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.restoreBackup);
router.post('/import', localOrAuthenticate, authorizeRoles('ADMIN', 'OWNER'), SystemController.importDatabase);

// Local-First Sync
router.post('/sync-now', authenticate, SystemController.syncNow);
router.get('/unsynced-count', authenticate, SystemController.getUnsyncedCount);
router.post('/sync/receive', SystemController.receiveSyncPayload);

export default router;
