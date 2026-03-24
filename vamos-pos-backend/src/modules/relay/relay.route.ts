import { Router } from 'express';
import { turnOn, turnOff, getStatus, scanPorts, reconnect } from './relay.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/on', authenticate, authorizeRoles('ADMIN', 'KASIR'), turnOn);
router.post('/off', authenticate, authorizeRoles('ADMIN', 'KASIR'), turnOff);
router.get('/status', authenticate, getStatus);

// Maintenance endpoints — hanya ADMIN
router.get('/scan', authenticate, authorizeRoles('ADMIN', 'MANAGER'), scanPorts);
router.post('/reconnect', authenticate, authorizeRoles('ADMIN', 'MANAGER'), reconnect);

export default router;
