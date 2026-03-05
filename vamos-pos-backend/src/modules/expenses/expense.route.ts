import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from './expense.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'OWNER', 'KASIR'));

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
