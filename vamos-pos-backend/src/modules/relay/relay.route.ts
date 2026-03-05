import { Router } from 'express';
import { turnOn, turnOff, getStatus } from './relay.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/on', authenticate, authorizeRoles('ADMIN', 'KASIR'), turnOn);
router.post('/off', authenticate, authorizeRoles('ADMIN', 'KASIR'), turnOff);
router.get('/status', authenticate, getStatus);

export default router;
