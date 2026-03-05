import { Request, Response, NextFunction } from 'express';
import { VenueService } from './venue.service';

export class VenueController {
    static async createVenue(req: Request, res: Response, next: NextFunction) {
        try {
            const venue = await VenueService.createVenue(req.body);
            res.status(201).json({ success: true, data: venue });
        } catch (error) {
            next(error);
        }
    }

    static async getVenues(req: Request, res: Response, next: NextFunction) {
        try {
            const venues = await VenueService.getVenues();
            res.json({ success: true, data: venues });
        } catch (error) {
            next(error);
        }
    }

    static async getVenueById(req: Request, res: Response, next: NextFunction) {
        try {
            const venue = await VenueService.getVenueById(req.params.id);
            res.json({ success: true, data: venue });
        } catch (error) {
            next(error);
        }
    }

    static async updateVenue(req: Request, res: Response, next: NextFunction) {
        try {
            const venue = await VenueService.updateVenue(req.params.id, req.body);
            res.json({ success: true, data: venue });
        } catch (error) {
            next(error);
        }
    }

    static async deleteVenue(req: Request, res: Response, next: NextFunction) {
        try {
            await VenueService.deleteVenue(req.params.id);
            res.json({ success: true, message: 'Venue deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}
