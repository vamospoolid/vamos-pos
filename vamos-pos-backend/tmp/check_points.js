const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const memberId = '0dd99c64-a238-4638-a8b5-1701118742627';
    const logs = await prisma.pointLog.findMany({
        where: { memberId },
        take: 10
    });
    console.log('Point Logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
