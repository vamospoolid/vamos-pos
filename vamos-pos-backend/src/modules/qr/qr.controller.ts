import { Request, Response } from 'express';
import { QRService } from './qr.service';
import { catchAsync } from '../../utils/catchAsync';

export const getMenu = catchAsync(async (req: Request, res: Response) => {
    const { tableId } = req.params;
    const result = await QRService.getMenuForTable(tableId);
    res.json({ success: true, data: result });
});

export const createOrder = catchAsync(async (req: Request, res: Response) => {
    const { tableId } = req.params;
    const { cart, waiterName, areaNote, customerName, memberId } = req.body; // Array of { productId, quantity, notes }, waiterName, areaNote, customerName, memberId
    const result = await QRService.createOrderForTable(tableId, cart, waiterName, areaNote, customerName, memberId);
    res.json({ success: true, data: result });
});
