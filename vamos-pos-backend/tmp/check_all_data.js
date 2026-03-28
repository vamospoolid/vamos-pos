const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allSessions = await prisma.session.findMany({
        take: 10,
        select: { id: true, memberId: true, status: true, totalAmount: true }
    });
    console.log('All Sessions:', JSON.stringify(allSessions, null, 2));

    const allExpenses = await prisma.expense.findMany({
        take: 10,
        select: { id: true, memberId: true, category: true, isDebt: true, status: true }
    });
    console.log('All Expenses:', JSON.stringify(allExpenses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
