const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.findMany({ where: { deletedAt: null } });
    const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
    const tables = await prisma.table.findMany({ where: { deletedAt: null } });
    
    const data = { products, venue, tables };
    fs.writeFileSync('scripts/clean_data.json', JSON.stringify(data, null, 2), 'utf8');
}
main().finally(() => prisma.$disconnect());
