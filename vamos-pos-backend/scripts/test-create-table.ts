import { TableService } from '../src/modules/tables/table.service';
import { prisma } from '../src/database/db';

async function test() {
    console.log('--- TEST CREATE TABLE (TS) ---');
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
    } catch (err: any) {
        console.error('ERROR:', err);
    }
}

test().finally(() => prisma.$disconnect());
