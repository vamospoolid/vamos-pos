import { Request, Response } from 'express';
import { ShiftService } from './shift.service';
import { catchAsync } from '../../utils/catchAsync';

export const startShift = catchAsync(async (req: Request, res: Response) => {
    const { startingCash, notes } = req.body;
    const shift = await ShiftService.startShift((req as any).user.id, startingCash || 0, notes);
    res.status(201).json({ success: true, data: shift });
});

export const closeShift = catchAsync(async (req: Request, res: Response) => {
    const { endingCashActual, notes, cashBreakdown, differenceReason } = req.body;
    const shift = await ShiftService.closeShift(
        (req as any).user.id,
        Number(endingCashActual) || 0,
        notes,
        cashBreakdown,
        differenceReason
    );
    res.json({ success: true, data: shift });
});

export const getActiveShift = catchAsync(async (req: Request, res: Response) => {
    const shift = await ShiftService.getActiveShift((req as any).user.id);
    res.json({ success: true, data: shift || null });
});

export const getActiveShiftSummary = catchAsync(async (req: Request, res: Response) => {
    const summary = await ShiftService.getActiveShiftSummary((req as any).user.id);
    res.json({ success: true, data: summary });
});

export const getShiftSummaryById = catchAsync(async (req: Request, res: Response) => {
    const summary = await ShiftService.getShiftSummaryById(req.params.id);
    res.json({ success: true, data: summary });
});

export const getAllShifts = catchAsync(async (req: Request, res: Response) => {
    const shifts = await ShiftService.getAllShifts();
    res.json({ success: true, data: shifts });
});

export const getShiftReport = catchAsync(async (req: Request, res: Response) => {
    const shifts = await ShiftService.getShiftReport(req.query.date as string);
    res.json({ success: true, data: shifts });
});
