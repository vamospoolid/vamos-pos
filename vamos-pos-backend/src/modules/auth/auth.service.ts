import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class AuthService {
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError('Invalid credentials', 400);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError('Invalid credentials', 400);

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'] }
        );

        return { user, token };
    }
}
