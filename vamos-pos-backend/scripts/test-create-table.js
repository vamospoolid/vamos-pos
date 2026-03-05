const { TableService } = require('../src/modules/tables/table.service');
const { prisma } = require('../src/database/db');

async function test() {
    console.log('--- TEST CREATE TABLE ---');
    try {
        const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        if (!venue) {
            console.log('No active venue found!');
            return;
        }
        console.log(`Using Venue: ${venue.name} (${venue.id})`);

        const result = await TableService.createTable({
            venueId: venue.id,
            name: 'TEST TABLE ' + Date.now(),
            type: 'REGULAR',
            relayChannel: 99
        });
        console.log('Result:', result);
    } catch (err) {
        console.error('ERROR OBJECT:', err);
        console.error('ERROR MESSAGE:', err.message);
        if (err.response) console.error('RESPONSE:', err.response.data);
    }
}

test().finally(() => prisma.$disconnect());
