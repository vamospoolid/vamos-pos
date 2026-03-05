import { Router } from 'express';
import { startShift, closeShift, getActiveShift, getAllShifts, getShiftReport } from './shift.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/active', getActiveShift);
router.post('/start', startShift);
router.post('/close', closeShift);

router.use(authorizeRoles('ADMIN', 'MANAGER', 'OWNER'));
router.get('/', getAllShifts);
router.get('/reports', getShiftReport);

export default router;
