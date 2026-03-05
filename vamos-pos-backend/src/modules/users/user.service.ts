import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export class UserService {
    static async createUser(data: { name: string; email: string; password?: string; role?: Role }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new AppError('Email already in use', 400);

        const hashedPassword = await bcrypt.hash(data.password || '12345678', 10);

        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role || 'KASIR'
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
    }

    static async getUsers() {
        return prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getUserById(id: string) {
        const user = await prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    static async updateUser(id: string, data: { name?: string; email?: string; role?: Role; password?: string }) {
        const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
        if (!user) throw new AppError('User not found', 404);

        if (data.email && data.email !== user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) throw new AppError('Email already in use', 400);
        }

        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, updatedAt: true }
        });
    }

    static async deleteUser(id: string) {
        const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
        if (!user) throw new AppError('User not found', 404);

        // Soft delete the user so relations remain intact but they can't login
        return prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                email: `deleted_${Date.now()}_${user.email}` // Allow email reuse
            }
        });
    }
}
