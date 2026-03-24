const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.findMany({ where: { deletedAt: null } });
    products.forEach(p => {
        console.log(`PROD|${p.name}|${p.price}|${p.stock}|${p.category}`);
    });
    const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
    if(venue) console.log(`VENUE|${venue.name}|${venue.address}|${venue.relayComPort}`);
    const tables = await prisma.table.findMany({ where: { deletedAt: null } });
    tables.forEach(t => {
        console.log(`TABLE|${t.name}|${t.type}|${t.relayChannel}`);
    });
}
main().finally(() => prisma.$disconnect());
