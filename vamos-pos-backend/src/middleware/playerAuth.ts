import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

export const playerAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const deviceId = req.headers['x-device-id'] as string;

    if (!authHeader || !authHeader.startsWith('player_')) {
        return res.status(401).json({ success: false, message: 'Unauthorized access. Please login.' });
    }

    if (!deviceId) {
        return res.status(401).json({ success: false, message: 'Device verification required.' });
    }

    const memberId = authHeader.replace('player_', '');

    try {
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!member) {
            return res.status(401).json({ success: false, message: 'Session invalid.' });
        }

        // 1-Device-1-ID Logic
        if (member.deviceId && member.deviceId !== deviceId) {
            return res.status(401).json({ 
                success: false, 
                message: 'This account is logged in on another device. Please login again to use this device.' 
            });
        }

        // Attach member to request
        (req as any).member = member;
        next();
    } catch (error) {
        next(error);
    }
};
