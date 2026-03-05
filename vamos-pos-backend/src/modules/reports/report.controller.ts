import { Request, Response } from 'express';
import { ReportService } from './report.service';
import { catchAsync } from '../../utils/catchAsync';

export const getDailyRevenue = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await ReportService.getDailyRevenue(days, startDate, endDate);
    res.json({ success: true, data: result });
});

/** Current operational day revenue — uses OPEN_HOUR cycle, not midnight */
export const getOperationalDayRevenue = catchAsync(async (_req: Request, res: Response) => {
    const result = await ReportService.getCurrentOperationalDayRevenue();
    res.json({ success: true, data: result });
});

export const getTodayUtilizationSplit = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getTodayUtilizationSplit();
    res.json({ success: true, data: result });
});

export const getTableUtilization = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await ReportService.getTableUtilization(days, startDate, endDate);
    res.json({ success: true, data: result });
});

export const getTopPlayers = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await ReportService.getTopPlayers(days, startDate, endDate);
    res.json({ success: true, data: result });
});

export const getTopProducts = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await ReportService.getTopProducts(days, startDate, endDate);
    res.json({ success: true, data: result });
});

export const getTransactionList = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 1;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await ReportService.getTransactionList(days, startDate, endDate);
    res.json({ success: true, data: result });
});
