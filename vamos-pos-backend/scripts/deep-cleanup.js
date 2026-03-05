const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEEP CLEANUP ---');

    // 1. Delete all tables with ID "" (literal empty string)
    const del = await prisma.table.deleteMany({
        where: { id: { equals: "" } }
    });
    console.log(`Deleted ${del.count} tables with literal empty ID string.`);

    // 2. Clear all tables that were created in the last 15 minutes to start fresh if needed
    // Actually, let's just delete the ones that are obviously test data
    const delTest = await prisma.table.deleteMany({
        where: { name: { startsWith: 'TEST TABLE' } }
    });
    console.log(`Deleted ${delTest.count} test tables.`);

    // 3. Show current active tables
    const active = await prisma.table.findMany({ where: { deletedAt: null } });
    console.log('\nCURRENT ACTIVE TABLES:');
    active.forEach(t => console.log(JSON.stringify(t)));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
