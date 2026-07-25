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
    const { cart } = req.body; // Array of { productId, quantity }
    const result = await QRService.createOrderForTable(tableId, cart);
    res.json({ success: true, data: result });
});
