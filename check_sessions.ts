import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const sessions = await prisma.session.findMany({
        where: { status: 'ACTIVE' },
        select: {
            id: true,
            tableId: true,
            startTime: true,
            pausedAt: true,
            totalPausedMs: true,
            durationOpts: true,
            table: { select: { name: true } }
        }
    });
    console.log(JSON.stringify(sessions, null, 2));
    await prisma.$disconnect();
}

check();
