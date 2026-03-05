const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const tables = await prisma.table.findMany();
    console.log('--- TABLES ---');
    console.log(JSON.stringify(tables, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
