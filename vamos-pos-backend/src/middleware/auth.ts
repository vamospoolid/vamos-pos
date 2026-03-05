import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { Role } from '@prisma/client';
import { prisma } from '../database/db';

export interface AuthRequest extends Request {
    user?: { id: string; role: Role };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            next(new AppError('Unauthorized', 401));
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; role: Role };

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            next(new AppError('Unauthorized: User token invalid or expired', 401));
            return;
        }

        req.user = decoded;
        next();
    } catch (err) {
        next(new AppError('Unauthorized', 401));
    }
};

export const authorizeRoles = (...roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new AppError('Forbidden', 403);
        }
        next();
    };
};
