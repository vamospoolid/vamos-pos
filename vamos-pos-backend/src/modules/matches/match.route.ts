import { Router } from 'express';
import { recordMatch, getLeaderboard } from './match.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, authorizeRoles('ADMIN', 'KASIR'), recordMatch);
router.get('/leaderboard', authenticate, authorizeRoles('ADMIN', 'KASIR', 'OWNER'), getLeaderboard);

export default router;
