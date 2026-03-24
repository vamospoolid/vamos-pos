import { Router } from 'express';
import { getExpenses, getPendingDebtsCount, createExpense, deleteExpense, payDebt, bulkDeleteExpenses } from './expense.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'OWNER', 'KASIR'));

router.get('/', getExpenses);
router.get('/pending-count', getPendingDebtsCount);
router.post('/', createExpense);
router.post('/:id/pay-debt', payDebt);
router.post('/bulk-delete', bulkDeleteExpenses);
router.delete('/:id', deleteExpense);

export default router;
