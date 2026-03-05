import { Request, Response, NextFunction } from 'express';
import { PricingService } from './pricing.service';

export class PricingController {
    // Pricing Rules
    static async createPricingRule(req: Request, res: Response, next: NextFunction) {
        try {
            const rule = await PricingService.createPricingRule(req.body);
            res.status(201).json({ success: true, data: rule });
        } catch (error) { next(error); }
    }

    static async getPricingRules(req: Request, res: Response, next: NextFunction) {
        try {
            const rules = await PricingService.getPricingRules();
            res.json({ success: true, data: rules });
        } catch (error) { next(error); }
    }

    static async updatePricingRule(req: Request, res: Response, next: NextFunction) {
        try {
            const rule = await PricingService.updatePricingRule(req.params.id, req.body);
            res.json({ success: true, data: rule });
        } catch (error) { next(error); }
    }

    static async deletePricingRule(req: Request, res: Response, next: NextFunction) {
        try {
            await PricingService.deletePricingRule(req.params.id);
            res.json({ success: true, message: 'Pricing rule deleted' });
        } catch (error) { next(error); }
    }

    // Packages
    static async createPackage(req: Request, res: Response, next: NextFunction) {
        try {
            const pkg = await PricingService.createPackage(req.body);
            res.status(201).json({ success: true, data: pkg });
        } catch (error) { next(error); }
    }

    static async getPackages(req: Request, res: Response, next: NextFunction) {
        try {
            const pkgs = await PricingService.getPackages();
            res.json({ success: true, data: pkgs });
        } catch (error) { next(error); }
    }

    static async updatePackage(req: Request, res: Response, next: NextFunction) {
        try {
            const pkg = await PricingService.updatePackage(req.params.id, req.body);
            res.json({ success: true, data: pkg });
        } catch (error) { next(error); }
    }

    static async deletePackage(req: Request, res: Response, next: NextFunction) {
        try {
            await PricingService.deletePackage(req.params.id);
            res.json({ success: true, message: 'Package deleted' });
        } catch (error) { next(error); }
    }

    static async estimate(req: Request, res: Response, next: NextFunction) {
        try {
            const { tableType, durationMinutes, isMember, startTime } = req.query;
            const estimate = await PricingService.estimatePrice(
                tableType as string,
                parseInt(durationMinutes as string),
                isMember === 'true',
                startTime ? new Date(startTime as string) : new Date()
            );
            res.json({ success: true, data: estimate });
        } catch (error) { next(error); }
    }
}
