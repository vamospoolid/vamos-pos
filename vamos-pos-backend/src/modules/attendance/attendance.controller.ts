import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';

export class AttendanceController {
    static async checkIn(req: Request, res: Response, next: NextFunction) {
        try {
            const attendance = await AttendanceService.recordCheckIn(req.body);
            res.status(201).json({ success: true, data: attendance });
        } catch (error) { next(error); }
    }

    static async checkOut(req: Request, res: Response, next: NextFunction) {
        try {
            const attendance = await AttendanceService.recordCheckOut(req.params.id, req.body.notes);
            res.json({ success: true, data: attendance });
        } catch (error) { next(error); }
    }

    static async getDaily(req: Request, res: Response, next: NextFunction) {
        try {
            const date = req.query.date as string || new Date().toISOString();
            const attendances = await AttendanceService.getDailyAttendance(date);

            // Wrap in consistent DTO format
            const formatted = attendances.map((a: {
                id: string;
                employeeId: string;
                employee: { name: string; position: string };
                date: Date;
                checkIn: Date | null;
                checkOut: Date | null;
                status: string;
                notes: string | null;
            }) => ({
                id: a.id,
                employeeId: a.employeeId,
                employeeName: a.employee.name,
                position: a.employee.position,
                date: a.date,
                checkIn: a.checkIn,
                checkOut: a.checkOut,
                status: a.status,
                notes: a.notes
            }));

            res.json({ success: true, data: formatted });
        } catch (error) { next(error); }
    }
}
