import { Request, Response, NextFunction } from 'express';
import { DiscountService } from './discount.service';

export class DiscountController {
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await DiscountService.create(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const results = await DiscountService.getAll();
            res.json({ success: true, data: results });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await DiscountService.update(req.params.id, req.body);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await DiscountService.delete(req.params.id);
            res.json({ success: true, message: 'Discount category deleted' });
        } catch (error) { next(error); }
    }
}
