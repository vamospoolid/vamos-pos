import { Router } from 'express';
import { createManualIncome, getManualIncomes } from './payment.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/manual-income', createManualIncome);
router.get('/manual-income', getManualIncomes);

export default router;
