import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
    static async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error) { next(error); }
    }

    static async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await UserService.getUsers();
            res.json({ success: true, data: users });
        } catch (error) { next(error); }
    }

    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.getUserById(req.params.id);
            res.json({ success: true, data: user });
        } catch (error) { next(error); }
    }

    static async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.updateUser(req.params.id, req.body);
            res.json({ success: true, data: user });
        } catch (error) { next(error); }
    }

    static async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            await UserService.deleteUser(req.params.id);
            res.json({ success: true, message: 'User access revoked successfully' });
        } catch (error) { next(error); }
    }
}
