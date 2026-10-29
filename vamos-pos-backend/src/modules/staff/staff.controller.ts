import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { OrderService } from '../orders/order.service';
import { getIO } from '../../socket';

export class StaffController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, pinCode } = req.body;
            const result = await StaffService.login(phone, pinCode);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getVenueLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const venue = await StaffService.getVenueLocation();
            res.json({ success: true, data: venue });
        } catch (error) {
            next(error);
        }
    }

    static async checkIn(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.checkIn(req.body);
            res.status(201).json({ success: true, data: result, message: 'Absensi masuk berhasil' });
        } catch (error) {
            next(error);
        }
    }

    static async checkOut(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.checkOut(req.body);
            res.json({ success: true, data: result, message: 'Absensi pulang berhasil' });
        } catch (error) {
            next(error);
        }
    }

    static async getAttendanceHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { employeeId } = req.params;
            const { month } = req.query;
            const history = await StaffService.getAttendanceHistory(employeeId, month as string);
            res.json({ success: true, data: history });
        } catch (error) {
            next(error);
        }
    }

    static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const { month } = req.query;
            const leaderboard = await StaffService.getLeaderboard(month as string);
            res.json({ success: true, data: leaderboard });
        } catch (error) {
            next(error);
        }
    }

    static async getDailyOmzetMilestone(req: Request, res: Response, next: NextFunction) {
        try {
            const milestone = await StaffService.getDailyOmzetMilestone();
            res.json({ success: true, data: milestone });
        } catch (error) {
            next(error);
        }
    }

    static async getBonusConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const config = StaffService.getBonusConfig();
            res.json({ success: true, data: config });
        } catch (error) {
            next(error);
        }
    }

    static async updateBonusConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const updated = StaffService.updateBonusConfig(req.body);
            res.json({ success: true, data: updated, message: 'Pengaturan target & bonus staf berhasil disimpan' });
        } catch (error) {
            next(error);
        }
    }

    static async updateJobdesk(req: Request, res: Response, next: NextFunction) {
        try {
            const { employeeId } = req.params;
            const { jobdesk } = req.body;
            const result = await StaffService.updateEmployeeJobdesk(employeeId, jobdesk);
            res.json({ success: true, data: result, message: 'SOP & Jobdesk staf berhasil disimpan' });
        } catch (error) {
            next(error);
        }
    }

    static async updateVenueLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.updateVenueLocation(req.body);
            res.json({ success: true, data: result, message: 'Koordinat lokasi & radius venue berhasil disimpan' });
        } catch (error) {
            next(error);
        }
    }

    static async resolveGoogleMapsUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const { url } = req.body;
            const result = await StaffService.resolveGoogleMapsUrl(url);
            res.json({ success: true, data: result, message: 'Titik koordinat berhasil diekstrak dari Google Maps' });
        } catch (error) {
            next(error);
        }
    }

    static async clockWithPin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.clockWithPin(req.body);
            res.json({ success: true, data: result, message: result.message });
        } catch (error) {
            next(error);
        }
    }

    static async adjustAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await StaffService.adjustAttendance(id, req.body);
            res.json({ success: true, data: result, message: 'Presensi staf berhasil dikoreksi' });
        } catch (error) {
            next(error);
        }
    }

    static async runAutoCutoff(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.runAttendanceAutoCutoff();
            res.json({ success: true, data: result, message: result.message });
        } catch (error) {
            next(error);
        }
    }

    static async updateApprovalStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { employeeId } = req.params;
            const { status, jobdesk } = req.body;
            const result = await StaffService.updateApprovalStatus(employeeId, status, jobdesk);
            res.json({ success: true, data: result, message: 'Status konfirmasi staf berhasil diperbarui' });
        } catch (error) {
            next(error);
        }
    }

    static async getTables(req: Request, res: Response, next: NextFunction) {
        try {
            const tables = await StaffService.getWaiterTables();
            res.json({ success: true, data: tables });
        } catch (error) {
            next(error);
        }
    }

    static async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const includeOp = req.query.includeOp === 'true';
            const products = await StaffService.getWaiterProducts(includeOp);
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async searchMembers(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = req.query;
            const members = await StaffService.searchMembers(query as string);
            res.json({ success: true, data: members });
        } catch (error) {
            next(error);
        }
    }

    static async getActiveCafeSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const sessions = await StaffService.getActiveCafeSessions();
            res.json({ success: true, data: sessions });
        } catch (error) {
            next(error);
        }
    }

    static async getKDSOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const orders = await OrderService.getKDSOrders();
            res.json({ success: true, data: orders });
        } catch (error) {
            next(error);
        }
    }

    static async updateKDSStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const result = await OrderService.updateKDSStatus(id, status);
            getIO().emit('kds:updated');
            getIO().emit('orders:updated');
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getWorkShifts(req: Request, res: Response, next: NextFunction) {
        try {
            const shifts = await StaffService.getWorkShifts();
            res.json({ success: true, data: shifts });
        } catch (error) {
            next(error);
        }
    }

    static async createWorkShift(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StaffService.createWorkShift(req.body);
            res.status(201).json({ success: true, data: result, message: 'Shift kerja berhasil ditambahkan' });
        } catch (error) {
            next(error);
        }
    }

    static async updateWorkShift(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await StaffService.updateWorkShift(id, req.body);
            res.json({ success: true, data: result, message: 'Shift kerja berhasil diperbarui' });
        } catch (error) {
            next(error);
        }
    }

    static async deleteWorkShift(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await StaffService.deleteWorkShift(id);
            res.json({ success: true, data: result, message: 'Shift kerja berhasil dihapus' });
        } catch (error) {
            next(error);
        }
    }
}

