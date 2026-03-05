import { Router } from 'express';
import { PlayerController } from './player.controller';

const router = Router();

// Publicly accessible for the player app
router.post('/register', PlayerController.register);
router.post('/login', PlayerController.login);
router.get('/tournaments', PlayerController.getTournaments);
router.get('/leaderboard', PlayerController.getLeaderboard);

// Profile and History
router.get('/:id', PlayerController.getProfile);
router.get('/:id/dashboard', PlayerController.getDashboard);
router.get('/:id/history', PlayerController.getMatchHistory);
router.get('/:id/h2h', PlayerController.getH2H);
router.put('/profile', PlayerController.updateProfile);
router.post('/tournaments/:id/register', PlayerController.registerTournament);

// Match Challenges
router.post('/challenge', PlayerController.createChallenge);
router.get('/:id/challenges', PlayerController.getChallenges);
router.put('/challenge/:id/respond', PlayerController.respondToChallenge);
router.put('/challenge/:id/complete', PlayerController.completeChallenge);

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

export default router;
