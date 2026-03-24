import { prisma } from './src/database/db';
import { SessionService } from './src/modules/sessions/session.service';

async function verifyDebt() {
    console.log('--- START DEBT VERIFICATION ---');

    const user = await prisma.user.findFirst();
    if (!user) return console.log('❌ No user found in database');
    console.log(`Using User ID: ${user.id}`);

    const memberId = '61a9cb52-16b2-4416-a02d-6a83d2e88386';
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return console.log('❌ Member not found');
    console.log(`Using Member ID: ${member.id}, Points: ${member.loyaltyPoints}`);

    const table = await prisma.table.findFirst();
    if (!table) return console.log('❌ No table found');
    console.log(`Using Table ID: ${table.id}`);

    try {
        console.log('\nCreating session...');
        const session = await SessionService.startSession(table.id, user.id, undefined, member.id, 60, 50000);
        console.log(`✅ Session created: ${session.id}, tableAmount: ${session.tableAmount}`);

        console.log('\nEnding session...');
        await SessionService.endSession(session.id, user.id);
        console.log('✅ Session ended');

        console.log('\nPaying as debt...');
        await SessionService.payAsDebt(session.id, user.id);
        console.log('✅ Debt paid');

        const memberAfter = await prisma.member.findUnique({ where: { id: memberId } });
        console.log(`\n--- RESULT ---`);
        console.log(`Previous Points: ${member.loyaltyPoints}`);
        console.log(`New Points: ${memberAfter?.loyaltyPoints}`);
        
        const expected = (member.loyaltyPoints || 0) + 50;
        if (memberAfter?.loyaltyPoints === expected) {
            console.log('✅ Loyalty points awarded correctly (+50)!');
        } else {
            console.log(`❌ Point mismatch! Expected ${expected}, got ${memberAfter?.loyaltyPoints}`);
        }
    } catch (error: any) {
        console.error('❌ Error in flow:', error);
        if (error.code === 'P2003') console.log('🔍 Foreign key error on: ', error.meta);
    }
}

verifyDebt().catch(console.error).finally(() => prisma.$disconnect());
