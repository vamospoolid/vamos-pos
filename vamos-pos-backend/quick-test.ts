import { prisma } from './src/database/db';
import { SessionService } from './src/modules/sessions/session.service';

async function quickVerify() {
    const memberId = '61a9cb52-16b2-4416-a02d-6a83d2e88386';
    const userId = (await prisma.user.findFirst())?.id;
    const tableId = (await prisma.table.findFirst())?.id;
    if (!userId || !tableId) return console.log('Missing data');

    const memberBefore = await prisma.member.findUnique({ where: { id: memberId } });
    console.log(`Before: ${memberBefore?.loyaltyPoints}`);

    // Create session directly to avoid relay issues
    const session = await prisma.session.create({
        data: {
            tableId,
            memberId,
            status: 'FINISHED',
            tableAmount: 50000,
            cashierId: userId,
        }
    });
    console.log(`Session created manually: ${session.id}`);

    // Test payAsDebt
    await SessionService.payAsDebt(session.id, userId);
    console.log('Debt paid manually');

    const memberAfter = await prisma.member.findUnique({ where: { id: memberId } });
    console.log(`After: ${memberAfter?.loyaltyPoints}`);
}

quickVerify().catch(console.error).finally(() => prisma.$disconnect());
