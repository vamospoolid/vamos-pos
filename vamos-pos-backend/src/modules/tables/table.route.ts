import { Router } from 'express';
import { TableController } from './table.controller';

const router = Router();

router.post('/', TableController.createTable);
router.post('/fix-stuck', TableController.fixStuckTables);
router.get('/', TableController.getTables);
router.get('/:id', TableController.getTableById);
router.put('/:id', TableController.updateTable);
router.delete('/:id', TableController.deleteTable);

export default router;
