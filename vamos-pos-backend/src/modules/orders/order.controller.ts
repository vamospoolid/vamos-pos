import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { catchAsync } from '../../utils/catchAsync';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { getIO } from '../../socket';

const addOrderSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
});

export const addOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id: sessionId } = req.params;
    const { productId, quantity } = addOrderSchema.parse(req.body);
    const result = await OrderService.addOrder(sessionId, productId, quantity, req.user!.id);
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
    const result = await OrderService.getKDSOrders();
    res.json({ success: true, data: result });
});

export const updateKDSStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await OrderService.updateKDSStatus(id, status);
    getIO().emit('kds:updated');
    res.json({ success: true, data: result });
});
