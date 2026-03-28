import { Router } from 'express';
import { PlayerController } from './player.controller';
import { playerAuth } from '../../middleware/playerAuth';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Publicly accessible for the player app
router.post('/register', PlayerController.register);
router.post('/login', PlayerController.login);
router.get('/tournaments', PlayerController.getTournaments);
router.get('/leaderboard', PlayerController.getLeaderboard);
router.get('/kings', PlayerController.getKings);
router.get('/hall-of-fame', PlayerController.getHallOfFame);
router.get('/venues', PlayerController.getVenues);

// Arena Management for Kasir/Admin
router.get('/challenges/pending-verification', authenticate, PlayerController.getPendingVerifications);
router.post('/challenges/admin-create', authenticate, PlayerController.adminCreateChallenge);
router.put('/challenge/:id/complete', authenticate, PlayerController.completeChallenge);

// --- PROTECTED ROUTES FOR PLAYERS (1-Device-1-ID) ---
router.use(playerAuth);

// Profile and History (Specifics first)
router.put('/profile', PlayerController.updateProfile);

// Match Challenges
router.post('/challenge', PlayerController.createChallenge);
router.put('/challenge/:id/respond', PlayerController.respondToChallenge);
router.put('/challenge/:id/link-session', PlayerController.linkSession);
router.put('/challenge/:id/claim-victory', PlayerController.claimVictory);

// Rewards
router.get('/rewards', PlayerController.getRewards);
router.post('/rewards/redeem', PlayerController.redeemReward);
router.get('/rewards/redemptions/member/:memberId', PlayerController.getRedemptions);

// Table & Booking
router.get('/tables', PlayerController.getTables);
router.get('/availability', PlayerController.getAvailability);
router.post('/booking', PlayerController.createBooking);

// Direct FNB Order
router.get('/menu', PlayerController.getMenu);
router.post('/order', PlayerController.placeOrder);

// Parameterized routes (Catch-alls for /:id, must be at the bottom)
router.get('/:id', PlayerController.getProfile);
router.get('/:id/dashboard', PlayerController.getDashboard);
router.get('/:id/history', PlayerController.getMatchHistory);
router.get('/:id/h2h', PlayerController.getH2H);
router.post('/tournaments/:id/register', PlayerController.registerTournament);
router.get('/:id/transactions', PlayerController.getTransactions);
router.get('/:id/unpaid-bills', PlayerController.getUnpaidBills);
router.get('/:id/challenges', PlayerController.getChallenges);

export default router;
