import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.table.findMany({
        include: { venue: true }
    });
    console.log('ALL TABLES IN DB:', JSON.stringify(tables, null, 2));

    const venues = await prisma.venue.findMany();
    console.log('ALL VENUES IN DB:', JSON.stringify(venues, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
