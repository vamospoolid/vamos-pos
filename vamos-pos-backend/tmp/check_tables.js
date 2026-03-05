const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tables = await prisma.table.findMany({
            select: { name: true, relayChannel: true },
            orderBy: { name: 'asc' }
        });
        console.log(JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
