const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for stuck tables...');
    const playingTables = await prisma.table.findMany({ where: { status: 'PLAYING' } });

    for (const table of playingTables) {
        const activeSession = await prisma.session.findFirst({
            where: { tableId: table.id, status: 'ACTIVE' },
        });
        if (!activeSession) {
            console.log(`Table ${table.name} is stuck! Fixing...`);
            await prisma.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });
        } else {
            console.log(`Table ${table.name} has active session ${activeSession.id}`);
        }
    }
    console.log('Done.');
}

main().catch(console.error);
