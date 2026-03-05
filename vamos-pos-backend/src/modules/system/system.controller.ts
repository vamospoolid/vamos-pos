import { Request, Response } from 'express';
import { SystemService } from './system.service';

export class SystemController {

    static async exportBackup(req: Request, res: Response) {
        try {
            const data = await SystemService.exportDatabase();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=backup-vamos-${new Date().toISOString().slice(0, 10)}.json`);
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async resetSystem(req: Request, res: Response) {
        try {
            const result = await SystemService.resetData();
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async seedDefaults(req: Request, res: Response) {
        try {
            const result = await SystemService.seedDefaults();
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async fixTables(req: Request, res: Response) {
        try {
            const result = await SystemService.fixStuckTables();
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
