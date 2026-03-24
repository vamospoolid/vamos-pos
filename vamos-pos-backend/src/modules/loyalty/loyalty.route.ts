import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import {
    getMemberLoyalty, getMemberPoints, redeemReward,
    getRewards, createReward, updateReward, deleteReward,
    toggleDoublePoint, getLoyaltyConfig, updateLoyaltyConfig,
    getLeaderboard, getMonthlyReport, awardPointsManual,
    getRedemptions, getPointLogs, updateRedemptionStatus, getPendingRedemptionCount,
    runPointExpiry,
} from './loyalty.controller';

const router = Router();

// ── Public / Member endpoints (authenticated) ─────────────────────
router.use(authenticate);

router.get('/rewards', getRewards);           // list active rewards
router.get('/leaderboard', getLeaderboard);       // top 10 members

router.get('/member/:id', getMemberLoyalty);     // full profile + logs
router.get('/member/:id/points', getMemberPoints);      // quick point check
router.post('/redeem', redeemReward);         // redeem a reward

// ── Admin endpoints ────────────────────────────────────────────────
router.use(authorizeRoles('ADMIN', 'MANAGER', 'OWNER'));

router.get('/config', getLoyaltyConfig);
router.patch('/config', updateLoyaltyConfig);
router.patch('/admin/double-point-toggle', toggleDoublePoint);
router.post('/admin/award-points', awardPointsManual);
router.get('/admin/report', getMonthlyReport);
router.get('/admin/redemptions', getRedemptions);
router.get('/admin/redemptions/pending-count', getPendingRedemptionCount);
router.get('/admin/logs', getPointLogs);
router.post('/admin/run-expiry', runPointExpiry);
router.patch('/admin/redemptions/:id', updateRedemptionStatus);

// Reward management
router.post('/rewards', createReward);
router.patch('/rewards/:id', updateReward);
router.delete('/rewards/:id', deleteReward);

export default router;
