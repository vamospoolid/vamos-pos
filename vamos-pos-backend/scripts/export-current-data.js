const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany({ where: { deletedAt: null } });
        console.log('---PRODUCTS_START---');
        console.log(JSON.stringify(products));
        console.log('---PRODUCTS_END---');
        
        const tables = await prisma.table.findMany({ where: { deletedAt: null } });
        console.log('---TABLES_START---');
        console.log(JSON.stringify(tables));
        console.log('---TABLES_END---');

        const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        console.log('---VENUE_START---');
        console.log(JSON.stringify(venue));
        console.log('---VENUE_END---');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
