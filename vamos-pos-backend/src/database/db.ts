import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL },
    },
    // Batasi koneksi pool agar tidak overwhelm PostgreSQL
    // Di production VPS dengan 1 instance backend, 10 koneksi sudah optimal
    log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
});
