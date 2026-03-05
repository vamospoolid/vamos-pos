import { Request, Response } from 'express';
import { MatchService } from './match.service';
import { catchAsync } from '../../utils/catchAsync';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

const recordMatchSchema = z.object({
    sessionId: z.string().min(1),
    memberIds: z.array(z.string().min(1)),
    winnerId: z.string().min(1).nullable().optional()
});

export const recordMatch = catchAsync(async (req: AuthRequest, res: Response) => {
    const parsed = recordMatchSchema.parse(req.body);
    const match = await MatchService.recordMatch(parsed.sessionId, parsed.memberIds, parsed.winnerId || null, req.user!.id);
    res.status(201).json(match);
});

export const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
    const leaderboard = await MatchService.getLeaderboard();
    res.json(leaderboard);
});
