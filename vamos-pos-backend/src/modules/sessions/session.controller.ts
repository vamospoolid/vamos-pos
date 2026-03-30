import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { catchAsync } from '../../utils/catchAsync';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { getIO } from '../../socket';
import { PrinterService } from '../system/printer.service';

const startSessionParams = z.object({
    tableId: z.string().min(1),
    packageId: z.string().min(1).optional(),
    memberId: z.string().min(1).optional(),
    durationOpts: z.number().int().positive().optional(),
    billingType: z.string().min(1).optional(),
});

export const startSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { tableId, packageId, memberId, durationOpts, billingType } = startSessionParams.parse(req.body);
    const session = await SessionService.startSession(tableId, req.user!.id, packageId, memberId, durationOpts, undefined, billingType);
    getIO().emit('sessions:updated');
    res.status(201).json(session);
});

export const endSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await SessionService.endSession(id, req.user!.id);
    getIO().emit('sessions:updated');
    res.json(result);
});

export const moveSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newTableId } = z.object({ newTableId: z.string().min(1) }).parse(req.body);
    const result = await SessionService.moveSession(id, newTableId, req.user!.id);
    getIO().emit('sessions:updated');
    res.json(result);
});

export const addDuration = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const schema = z.object({
        packageId: z.string().min(1).optional(),
        durationOpts: z.number().int().positive().optional(),
    });
    const { packageId, durationOpts } = schema.parse(req.body);
    const result = await SessionService.addDuration(id, req.user!.id, packageId, durationOpts);
    getIO().emit('sessions:updated');
    res.json(result);
});

export const pendingSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.body;
    const result = await SessionService.setPending(id, req.user!.id);
    getIO().emit('sessions:updated');
    res.json(result);
});

export const paySession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { method, discount, receivedAmount, taxAmount, serviceAmount } = req.body;
    const result = await SessionService.paySession(id, method, req.user!.id, discount, receivedAmount, taxAmount, serviceAmount);
    getIO().emit('sessions:updated');
    // Auto-print receipt in background
    PrinterService.printReceipt(id);
    res.json(result);
});

export const payAsDebt = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { discount, taxAmount, serviceAmount } = req.body;
    const result = await SessionService.payAsDebt(id, req.user!.id, discount, taxAmount || 0, serviceAmount || 0);
    getIO().emit('sessions:updated');
    // Auto-print receipt in background
    PrinterService.printReceipt(id);
    res.json(result);
});

export const getActive = catchAsync(async (req: Request, res: Response) => {
    const sessions = await SessionService.getActiveSessions();
    res.json(sessions);
});

export const getPending = catchAsync(async (req: Request, res: Response) => {
    const sessions = await SessionService.getPendingSessions();
    res.json(sessions);
});

export const createFnbOnly = catchAsync(async (req: AuthRequest, res: Response) => {
    const { memberId, customerName } = req.body;
    const session = await SessionService.createFnbSession(req.user!.id, memberId, customerName);
    getIO().emit('sessions:updated');
    res.status(201).json(session);
});

export const updateSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await SessionService.updateSession(id, req.body, req.user!.id);
    res.json(result);
});
