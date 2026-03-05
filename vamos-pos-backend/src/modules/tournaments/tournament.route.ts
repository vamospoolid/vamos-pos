import { Router } from 'express';
import { createTournament, getTournaments, getTournamentById, registerParticipant, generateBracket, updateMatchResult, updateMatchPlayers, finishTournament, deleteTournament, updateParticipantStatus } from './tournament.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), createTournament);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);

router.post('/:id/register', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), registerParticipant);
router.put('/:id/participants/:participantId/status', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateParticipantStatus);
router.post('/:id/generate-bracket', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), generateBracket);
router.put('/matches/:matchId', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateMatchResult);
router.put('/matches/:matchId/players', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateMatchPlayers);
router.post('/:id/finish', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), finishTournament);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), deleteTournament);

export default router;
