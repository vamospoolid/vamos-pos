import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation Error', details: err.errors });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(err);
    return res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
