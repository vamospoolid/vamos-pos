import { Router } from 'express';
import { startSession, endSession, pendingSession, paySession, payAsDebt, getActive, getPending, moveSession, addDuration, createFnbOnly, updateSession } from './session.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/start', authorizeRoles('ADMIN', 'KASIR'), startSession);
router.post('/move/:id', authorizeRoles('ADMIN', 'KASIR'), moveSession);
router.post('/add-duration/:id', authorizeRoles('ADMIN', 'KASIR'), addDuration);
router.post('/update/:id', authorizeRoles('ADMIN', 'KASIR'), updateSession);
router.post('/end/:id', authorizeRoles('ADMIN', 'KASIR'), endSession);
router.post('/pending', authorizeRoles('ADMIN', 'KASIR'), pendingSession);
router.post('/:id/pay', authorizeRoles('ADMIN', 'KASIR'), paySession);
router.post('/:id/pay-debt', authorizeRoles('ADMIN', 'KASIR'), payAsDebt);
router.post('/fnb-only', authorizeRoles('ADMIN', 'KASIR'), createFnbOnly);
router.get('/active', authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getActive);
router.get('/pending', authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getPending);

export default router;
