import { Router } from 'express';
import { startSession, endSession, pendingSession, paySession, getActive, getPending, moveSession, addDuration, createFnbOnly, pauseSession, resumeSession } from './session.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/start', authorizeRoles('ADMIN', 'KASIR'), startSession);
router.post('/move/:id', authorizeRoles('ADMIN', 'KASIR'), moveSession);
router.post('/add-duration/:id', authorizeRoles('ADMIN', 'KASIR'), addDuration);
router.post('/pause/:id', authorizeRoles('ADMIN', 'KASIR'), pauseSession);
router.post('/resume/:id', authorizeRoles('ADMIN', 'KASIR'), resumeSession);
router.post('/end/:id', authorizeRoles('ADMIN', 'KASIR'), endSession);
router.post('/pending', authorizeRoles('ADMIN', 'KASIR'), pendingSession);
router.post('/:id/pay', authorizeRoles('ADMIN', 'KASIR'), paySession);
router.post('/fnb-only', authorizeRoles('ADMIN', 'KASIR'), createFnbOnly);
router.get('/active', authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getActive);
router.get('/pending', authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getPending);

export default router;
