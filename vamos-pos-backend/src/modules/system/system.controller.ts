import { Request, Response } from 'express';
import { SystemService } from './system.service';
import { BackupService } from '../../utils/backup.service';
import { SyncService } from './sync.service';

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

    /**
     * POST /api/system/backup
     * Trigger backup pg_dump manual — simpan ke folder backups/
     */
    static async runBackup(req: Request, res: Response) {
        try {
            const result = await BackupService.runBackup();
            return res.status(result.success ? 200 : 500).json({
                success: result.success,
                file: result.file,
                message: result.message,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/system/backup/list
     * Daftar semua file backup yang tersimpan di server
     */
    static async listBackups(req: Request, res: Response) {
        try {
            const backups = BackupService.listBackups();
            return res.json({
                success: true,
                count: backups.length,
                backups,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async syncNow(req: Request, res: Response) {
        try {
            const syncedCount = await SyncService.syncPendingData();
            return res.json({ success: true, syncedCount });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getUnsyncedCount(req: Request, res: Response) {
        try {
            const count = await SyncService.getUnsyncedCount();
            return res.json({ success: true, count });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async receiveSyncPayload(req: Request, res: Response) {
        try {
            const actualSecret = process.env.SYNC_SECRET || 'sync_secret_key';
            const providedSecret = req.headers['x-sync-secret'];
            if (providedSecret !== actualSecret) {
                return res.status(401).json({ success: false, message: 'Invalid sync secret' });
            }
            const upsertedCount = await SyncService.receiveSyncPayload(req.body);
            return res.json({ success: true, upsertedCount });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

