import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export class AnnouncementController {
    static async getActive(req: Request, res: Response, next: NextFunction) {
        try {
            const announcements = await prisma.announcement.findMany({
                where: { isActive: true },
                orderBy: { priority: 'desc' },
                take: 5
            });
            res.json({ success: true, data: announcements });
        } catch (error) { next(error); }
    }

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const announcements = await prisma.announcement.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: announcements });
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, content, imageUrl, targetUrl, priority } = req.body;
            const announcement = await prisma.announcement.create({
                data: { title, content, imageUrl, targetUrl, priority: priority || 0 }
            });
            res.json({ success: true, data: announcement });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const announcement = await prisma.announcement.update({
                where: { id },
                data: req.body
            });
            res.json({ success: true, data: announcement });
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await prisma.announcement.delete({ where: { id } });
            res.json({ success: true, message: 'Announcement deleted' });
        } catch (error) { next(error); }
    }
}
