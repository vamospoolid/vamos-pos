import { Request, Response, NextFunction } from 'express';
import { TournamentService } from './tournament.service';
import { catchAsync } from '../../utils/catchAsync';

export const createTournament = catchAsync(async (req: Request, res: Response) => {
    const tournament = await TournamentService.createTournament(req.body);
    res.status(201).json({ success: true, data: tournament });
});

export const getTournaments = catchAsync(async (req: Request, res: Response) => {
    const tournaments = await TournamentService.getTournaments();
    res.json({ success: true, data: tournaments });
});

export const getTournamentById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tournament = await TournamentService.getTournamentById(id);
    if (!tournament) res.status(404).json({ success: false, message: 'Tournament not found' });
    else res.json({ success: true, data: tournament });
});

export const registerParticipant = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { memberId, name, handicap } = req.body;
    const pt = await TournamentService.registerParticipant(id, memberId, name, handicap);
    res.json({ success: true, data: pt });
});

export const updateParticipantStatus = catchAsync(async (req: Request, res: Response) => {
    const { id, participantId } = req.params;
    const { paymentStatus } = req.body;
    const pt = await TournamentService.updateParticipantStatus(id, participantId, paymentStatus);
    res.json({ success: true, data: pt });
});

export const generateBracket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const br = await TournamentService.generateBracket(id);
    res.json({ success: true, data: br });
});

export const updateMatchResult = catchAsync(async (req: Request, res: Response) => {
    const { matchId } = req.params;
    const dt = await TournamentService.updateMatchResult(matchId, req.body);
    res.json({ success: true, data: dt });
});

export const updateMatchPlayers = catchAsync(async (req: Request, res: Response) => {
    const { matchId } = req.params;
    const dt = await TournamentService.updateMatchPlayers(matchId, req.body);
    res.json({ success: true, data: dt });
});

export const finishTournament = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.finishTournament(id, req.body);
    res.json({ success: true, data: dt });
});

export const deleteTournament = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dt = await TournamentService.deleteTournament(id);
    res.json({ success: true, data: dt });
});
