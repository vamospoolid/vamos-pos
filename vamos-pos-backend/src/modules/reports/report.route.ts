import { Router } from 'express';
import { getDailyRevenue, getOperationalDayRevenue, getTableUtilization, getTopPlayers, getTopProducts, getTodayUtilizationSplit, getTransactionList } from './report.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'MANAGER', 'OWNER', 'KASIR'));

router.get('/daily-revenue', getDailyRevenue);
router.get('/operational-day', getOperationalDayRevenue);   // ← current business day (10 AM cycle)
router.get('/today-utilization-split', getTodayUtilizationSplit);
router.get('/table-utilization', getTableUtilization);
router.get('/top-players', getTopPlayers);
router.get('/top-products', getTopProducts);
router.get('/transactions', getTransactionList);

export default router;
