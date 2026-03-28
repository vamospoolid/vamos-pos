const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const expenses = await prisma.expense.findMany({});
    console.log('All Expenses Count:', expenses.length);
    if (expenses.length > 0) {
        console.log('Sample Expense:', JSON.stringify(expenses[0], null, 2));
    }

    const sessions = await prisma.session.findMany({ select: { id: true, memberId: true, status: true } });
    console.log('All Sessions Count:', sessions.length);
    const paidByMember = sessions.filter(s => s.memberId && s.status === 'PAID');
    console.log('Paid Sessions with Member:', paidByMember.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
