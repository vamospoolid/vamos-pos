import { Response } from 'express';
import { WaitlistService } from './waitlist.service';
import { catchAsync } from '../../utils/catchAsync';
import { AuthRequest } from '../../middleware/auth';
import { getIO } from '../../socket';
import { z } from 'zod';

const waitlistSchema = z.object({
    customerName: z.string().min(1),
    phone: z.string().optional(),
    partySize: z.number().int().positive().optional(),
    tableType: z.string().optional(),
    notes: z.string().optional(),
    reservedTime: z.string().optional(),
    tableId: z.string().optional(),
});

export const addToWaitlist = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = waitlistSchema.parse(req.body);
    const result = await WaitlistService.addToWaitlist(data, req.user!.id);
    getIO().emit('waitlist:updated');
    res.status(201).json(result);
});

export const getWaitlist = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await WaitlistService.getWaitlist();
    res.json(result);
});

export const updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, tableId } = z.object({ status: z.string(), tableId: z.string().optional() }).parse(req.body);
    const result = await WaitlistService.updateStatus(id, status, req.user!.id, tableId);
    getIO().emit('waitlist:updated');
    getIO().emit('sessions:updated');
    res.json(result);
});

export const deleteWaitlist = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await WaitlistService.deleteWaitlist(id, req.user!.id);
    getIO().emit('waitlist:updated');
    res.json(result);
});
