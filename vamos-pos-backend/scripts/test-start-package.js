const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const table = await prisma.table.findFirst({ where: { name: 'Table 01' } });
    if (!table) { console.log('Table not found'); return; }

    // Reset table status to AVAILABLE just in case
    await prisma.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });

    const pkg = await prisma.package.findFirst();
    if (!pkg) { console.log('Package not found'); return; }

    const user = await prisma.user.findFirst();

    console.log(`Starting session for ${table.name} with package ${pkg.name}...`);

    // We'll call the service logic directly
    const { SessionService } = require('../src/modules/sessions/session.service');

    try {
        const session = await SessionService.startSession(table.id, user.id, pkg.id);
        console.log('SUCCESS:', session.id);
    } catch (err) {
        console.error('FAILED:', err);
    }
}

main().catch(console.error);
