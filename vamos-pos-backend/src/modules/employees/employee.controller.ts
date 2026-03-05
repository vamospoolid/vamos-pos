import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';

export class EmployeeController {
    static async createEmployee(req: Request, res: Response, next: NextFunction) {
        try {
            const employee = await EmployeeService.createEmployee(req.body);
            res.status(201).json({ success: true, data: employee });
        } catch (error) { next(error); }
    }

    static async getEmployees(req: Request, res: Response, next: NextFunction) {
        try {
            const employees = await EmployeeService.getEmployees();
            res.json({ success: true, data: employees });
        } catch (error) { next(error); }
    }

    static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
        try {
            const employee = await EmployeeService.getEmployeeById(req.params.id);
            res.json({ success: true, data: employee });
        } catch (error) { next(error); }
    }

    static async updateEmployee(req: Request, res: Response, next: NextFunction) {
        try {
            const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
            res.json({ success: true, data: employee });
        } catch (error) { next(error); }
    }

    static async deleteEmployee(req: Request, res: Response, next: NextFunction) {
        try {
            await EmployeeService.deleteEmployee(req.params.id);
            res.json({ success: true, message: 'Employee terminated successfully' });
        } catch (error) { next(error); }
    }
}
