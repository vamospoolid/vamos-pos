import { Request, Response, NextFunction } from 'express';
import { TableService } from './table.service';

export class TableController {
    static async createTable(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('CREATE TABLE BODY:', JSON.stringify(req.body));
            const table = await TableService.createTable(req.body);
            res.status(201).json({ success: true, data: table });
        } catch (error: any) {
            console.error('CREATE TABLE ERROR:', error);
            next(error);
        }
    }

    static async getTables(req: Request, res: Response, next: NextFunction) {
        try {
            const venueId = req.query.venueId as string;
            const tables = await TableService.getTables(venueId);
            res.json({ success: true, data: tables });
        } catch (error) {
            next(error);
        }
    }

    static async getTableById(req: Request, res: Response, next: NextFunction) {
        try {
            const table = await TableService.getTableById(req.params.id);
            res.json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    static async updateTable(req: Request, res: Response, next: NextFunction) {
        try {
            const table = await TableService.updateTable(req.params.id, req.body);
            res.json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    static async deleteTable(req: Request, res: Response, next: NextFunction) {
        try {
            await TableService.deleteTable(req.params.id);
            res.json({ success: true, message: 'Table deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    static async fixStuckTables(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TableService.fixStuckTables();
            res.json({
                success: true,
                message: result.fixed > 0
                    ? `Fixed ${result.fixed} stuck table(s): ${result.tableNames.join(', ')}`
                    : 'No stuck tables found. All tables are clean.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
