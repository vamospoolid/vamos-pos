import { Router } from 'express';
import {
    getRewards, createReward, updateReward, deleteReward,
    redeemReward, getRedemptions, fulfillRedemption, getMemberRedemptions
} from './reward.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Public (authenticated) — member-facing
router.get('/', getRewards);                                                    // GET  /rewards
router.post('/redeem', redeemReward);                                           // POST /rewards/redeem  { memberId, rewardId }
router.get('/redemptions/member/:memberId', getMemberRedemptions);              // GET  /rewards/redemptions/member/:memberId

// Admin/Owner/Manager only
router.post('/', authorizeRoles('ADMIN', 'OWNER', 'MANAGER'), createReward);          // POST /rewards
router.put('/:id', authorizeRoles('ADMIN', 'OWNER', 'MANAGER'), updateReward);        // PUT  /rewards/:id
router.delete('/:id', authorizeRoles('ADMIN', 'OWNER', 'MANAGER'), deleteReward);     // DEL  /rewards/:id
router.get('/redemptions', authorizeRoles('ADMIN', 'OWNER', 'MANAGER', 'KASIR'), getRedemptions);     // GET  /rewards/redemptions
router.put('/redemptions/:id/fulfill', authorizeRoles('ADMIN', 'OWNER', 'MANAGER', 'KASIR'), fulfillRedemption); // PUT /rewards/redemptions/:id/fulfill

export default router;
