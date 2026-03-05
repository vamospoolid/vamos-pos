import { Router } from 'express';
import { addToWaitlist, getWaitlist, updateStatus, deleteWaitlist } from './waitlist.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getWaitlist);
router.post('/', authorizeRoles('ADMIN', 'KASIR'), addToWaitlist);
router.patch('/:id/status', authorizeRoles('ADMIN', 'KASIR'), updateStatus);
router.delete('/:id', authorizeRoles('ADMIN', 'KASIR'), deleteWaitlist);

export default router;
