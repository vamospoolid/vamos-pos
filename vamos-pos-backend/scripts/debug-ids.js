const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`));

    const sessions = await prisma.session.findMany({ include: { cashier: true } });
    console.log('--- SESSIONS ---');
    sessions.forEach(s => console.log(`ID: ${s.id}, CashierID: ${s.cashierId}, TableID: ${s.tableId}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
