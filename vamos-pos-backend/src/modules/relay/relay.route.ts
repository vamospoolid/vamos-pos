import { Router } from 'express';
import { turnOn, turnOff, getStatus, scanPorts, reconnect } from './relay.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/on', authenticate, authorizeRoles('ADMIN', 'KASIR', 'OWNER'), turnOn);
router.post('/off', authenticate, authorizeRoles('ADMIN', 'KASIR', 'OWNER'), turnOff);
router.get('/status', authenticate, getStatus);

// Maintenance endpoints — hanya ADMIN & OWNER
router.get('/scan', authenticate, authorizeRoles('ADMIN', 'MANAGER', 'OWNER'), scanPorts);
router.post('/reconnect', authenticate, authorizeRoles('ADMIN', 'MANAGER', 'OWNER'), reconnect);

export default router;
