const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const members = await prisma.member.findMany({ take: 3, select: { id: true, name: true } });
    console.log('Members:', JSON.stringify(members, null, 2));

    const sessions = await prisma.session.findMany({ 
        where: { status: 'PAID' },
        take: 5,
        select: { id: true, memberId: true, status: true, totalAmount: true }
    });
    console.log('Paid Sessions:', JSON.stringify(sessions, null, 2));

    const debts = await prisma.expense.findMany({
        where: { isDebt: true, status: 'PENDING' },
        take: 5,
        select: { id: true, memberId: true, amount: true }
    });
    console.log('Pending Debts:', JSON.stringify(debts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
