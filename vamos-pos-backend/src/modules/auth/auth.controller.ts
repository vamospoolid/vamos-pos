import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await AuthService.login(email, password);
    res.json(result);
});
