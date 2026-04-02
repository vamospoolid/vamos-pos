import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { TournamentService } from './tournament.service';
import { catchAsync } from '../../utils/catchAsync';
import { getIO } from '../../socket';
import { AppError } from '../../utils/errors';

export const createTournament = catchAsync(async (req: AuthRequest, res: Response) => {
    const tournament = await TournamentService.createTournament(req.body);
    getIO().emit('tournaments:updated');
    res.status(201).json({ success: true, data: tournament });
});

export const getTournaments = catchAsync(async (req: AuthRequest, res: Response) => {
    const tournaments = await TournamentService.getTournaments();
    res.json({ success: true, data: tournaments });
});

export const getTournamentById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tournament = await TournamentService.getTournamentById(id);
    if (!tournament) throw new AppError('Tournament not found', 404);
    res.json({ success: true, data: tournament });
});

export const updateTournament = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tournament = await TournamentService.updateTournament(id, req.body);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: tournament });
});

export const registerParticipant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { memberId, name, handicap, paymentMethod, status } = req.body;
    const pt = await TournamentService.registerParticipant(id, req.user!.id, memberId, name, handicap, undefined, status, paymentMethod);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: pt });
});

export const updateParticipantStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id, participantId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;
    const pt = await TournamentService.updateParticipantStatus(id, participantId, paymentStatus, req.user!.id, paymentMethod);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: pt });
});

export const generateBracket = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const br = await TournamentService.generateBracket(id);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: br });
});

export const updateMatchResult = catchAsync(async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;
    const dt = await TournamentService.updateMatchResult(matchId, req.body as any);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const updateMatchPlayers = catchAsync(async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;
    const dt = await TournamentService.updateMatchPlayers(matchId, req.body as any);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const finishTournament = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.finishTournament(id, req.body as any);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const deleteTournament = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.deleteTournament(id);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const resetBracket = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.resetBracket(id);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const removeParticipant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id, participantId } = req.params;
    const dt = await TournamentService.removeParticipant(id, participantId);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});

export const purgeParticipants = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.purgeParticipants(id);
    getIO().emit('tournaments:updated');
    res.json({ success: true, data: dt });
});
