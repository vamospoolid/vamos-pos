import { Router } from 'express';
import multer from 'multer';
import { createTournament, getTournaments, getTournamentById, getTournamentTables, assignMatchTable, registerParticipant, importParticipants, generateBracket, updateMatchResult, updateMatchPlayers, finishTournament, deleteTournament, updateParticipantStatus, removeParticipant, purgeParticipants, updateTournament, resetBracket, reshuffleBracket, updateParticipant } from './tournament.controller';
import { generateTournamentPromo, analyzePromoImage } from './tournament.creative.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public tournament viewing (Read-Only for spectators and live audience)
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/tables', getTournamentTables);

// Match table assignment & score update from scoreboard/bracket
router.put('/matches/:matchId/table', assignMatchTable);
router.put('/matches/:matchId', updateMatchResult);

router.use(authenticate);

// AI Creative & Content Automation routes
router.post('/creative/generate', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), generateTournamentPromo);
router.post('/creative/analyze-image', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), upload.single('image'), analyzePromoImage);

router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), createTournament);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateTournament);

router.post('/:id/register', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), registerParticipant);
router.post('/:id/import-participants', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), importParticipants);
router.put('/:id/participants/:participantId', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateParticipant);
router.put('/:id/participants/:participantId/status', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateParticipantStatus);
router.post('/:id/generate-bracket', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), generateBracket);
router.post('/:id/reset-bracket', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), resetBracket);
router.post('/:id/reshuffle-bracket', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), reshuffleBracket);
router.put('/matches/:matchId', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateMatchResult);
router.put('/matches/:matchId/players', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), updateMatchPlayers);
router.post('/:id/finish', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), finishTournament);
router.delete('/:id/participants/:participantId', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), removeParticipant);
router.delete('/:id/participants', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), purgeParticipants);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER', 'KASIR', 'OWNER'), deleteTournament);

export default router;

