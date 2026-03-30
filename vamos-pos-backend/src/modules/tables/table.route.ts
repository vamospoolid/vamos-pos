import { Router } from 'express';
import { TableController } from './table.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, authorizeRoles('ADMIN', 'OWNER'), TableController.createTable);
router.post('/fix-stuck', authenticate, authorizeRoles('ADMIN', 'OWNER'), TableController.fixStuckTables);
router.get('/', authenticate, TableController.getTables);
router.get('/:id', authenticate, TableController.getTableById);
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), TableController.updateTable);
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), TableController.deleteTable);

export default router;
