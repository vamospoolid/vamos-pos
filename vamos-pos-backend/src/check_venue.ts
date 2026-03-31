import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const venue = await prisma.venue.findFirst();
    console.log('--- VENUE INFO ---');
    console.log(JSON.stringify(venue, null, 2));
    process.exit(0);
}
main();
