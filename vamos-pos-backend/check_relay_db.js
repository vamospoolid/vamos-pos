const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const venue = await prisma.venue.findFirst();
    console.log('VENUE RELAY PORT:', venue ? venue.relayComPort : 'NULL');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
