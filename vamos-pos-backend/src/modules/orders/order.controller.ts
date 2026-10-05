import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { catchAsync } from '../../utils/catchAsync';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { getIO } from '../../socket';

const addOrderSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
});

export const addOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id: sessionId } = req.params;
    const { productId, quantity, notes } = addOrderSchema.parse(req.body);
    const result = await OrderService.addOrder(sessionId, productId, quantity, req.user!.id, notes);
    getIO().emit('orders:updated');
    getIO().emit('sessions:updated');
    getIO().emit('kds:updated');
    res.status(201).json(result);
});

export const removeOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.removeOrder(id, req.user!.id);
    getIO().emit('orders:updated');
    getIO().emit('sessions:updated');
    getIO().emit('kds:updated');
    res.json(result);
});

export const getKDSOrders = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.query;
    const result = await OrderService.getKDSOrders(status as string);
    res.json({ success: true, data: result });
});

export const serveSessionKDS = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const result = await OrderService.serveSessionKDS(sessionId);
    getIO().emit('kds:updated');
    res.json({ success: true, data: result });
});

export const revertSessionKDS = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const result = await OrderService.revertSessionKDS(sessionId);
    getIO().emit('kds:updated');
    res.json({ success: true, data: result });
});

export const updateKDSStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await OrderService.updateKDSStatus(id, status);
    getIO().emit('kds:updated');
    res.json({ success: true, data: result });
});
