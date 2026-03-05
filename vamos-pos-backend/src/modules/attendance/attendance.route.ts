import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER')); // Kasir can record attendance

router.post('/checkin', AttendanceController.checkIn);
router.put('/checkout/:id', AttendanceController.checkOut);
router.get('/daily', AttendanceController.getDaily);

export default router;
