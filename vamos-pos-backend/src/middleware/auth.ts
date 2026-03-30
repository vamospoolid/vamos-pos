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

        // --- SOLUSI BUG LOGOUT PLAYER APP ---
        // Player App mengirim token 'player_...' yang BUKAN jwt, sehingga jwt.verify() sebelumnya akan melempar error dan men-tendang user.
        if (token.startsWith('player_')) {
            const memberId = token.replace('player_', '');
            const member = await prisma.member.findUnique({ where: { id: memberId } });
            if (!member) {
                next(new AppError('Unauthorized: Player token invalid', 401));
                return;
            }
            req.user = { id: member.id, role: 'MEMBER' as any };
            return next();
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
        if (!req.user) {
            throw new AppError('Forbidden', 403);
        }

        const userRole = req.user.role;
        
        // HIERARCHY: ADMIN and OWNER can do anything each other can
        const allowedRoles = [...roles];
        if (allowedRoles.includes('OWNER') && !allowedRoles.includes('ADMIN')) {
            allowedRoles.push('ADMIN');
        }
        if (allowedRoles.includes('ADMIN') && !allowedRoles.includes('OWNER')) {
            allowedRoles.push('OWNER');
        }

        if (!allowedRoles.includes(userRole)) {
            throw new AppError('Forbidden', 403);
        }
        next();
    };
};
