import { prisma } from './src/database/db';
import { MemberService } from './src/modules/members/member.service';
import { SessionService } from './src/modules/sessions/session.service';

async function verify() {
    console.log('--- START VERIFICATION ---');

    const testPhone = '08123456789' + Date.now();
    
    // 1. Verify Registration Points
    console.log('\n1. Verifying Registration Points...');
    const member = await MemberService.createMember({
        name: 'Test Member',
        phone: testPhone
    });

    const memberAfterReg = await prisma.member.findUnique({ where: { id: member.id } });
    console.log(`Member registered. Points: ${memberAfterReg?.loyaltyPoints}`);
    if (memberAfterReg?.loyaltyPoints === 100) {
        console.log('✅ Registration points awarded correctly (100).');
    } else {
        console.log(`❌ Registration points FAILED. Got ${memberAfterReg?.loyaltyPoints}`);
    }

    // 2. Verify Debt Payment Points
    console.log('\n2. Verifying Debt Payment Points...');
    
    // Create a table if none exists
    let table = await prisma.table.findFirst();
    if (!table) {
        console.log('No table found, creating one...');
        const venue = await prisma.venue.findFirst() || await prisma.venue.create({
            data: {
                name: 'Test Venue',
                address: 'Test Address'
            }
        });
        table = await prisma.table.create({
            data: {
                name: 'Table Verification',
                type: 'POCKET',
                relayChannel: 1,
                venueId: venue.id
            }
        });
    }

    const validUserId = 'b96c8a47-5951-4d7c-b9be-bb7a962a90fe';

    // Start a session
    const session = await SessionService.startSession(table.id, validUserId, undefined, member.id, 60, 50000);
    console.log(`Session started for member. Table Amount: ${session.tableAmount}`);

    // End session
    await SessionService.endSession(session.id, validUserId);
    
    // Pay as debt (BON)
    // subtotal 50,000 should give 50 points
    await SessionService.payAsDebt(session.id, validUserId);

    const memberAfterDebt = await prisma.member.findUnique({ where: { id: member.id } });
    console.log(`Debt paid. New Points: ${memberAfterDebt?.loyaltyPoints}`);
    
    // Total should be 100 (reg) + 50 (session) = 150
    if (memberAfterDebt?.loyaltyPoints === 150) {
        console.log('✅ Debt payment points awarded correctly (+50).');
    } else {
        console.log(`❌ Debt payment points FAILED. Expected 150, got ${memberAfterDebt?.loyaltyPoints}`);
    }

    // Cleanup
    await prisma.pointLog.deleteMany({ where: { memberId: member.id } });
    await prisma.expense.deleteMany({ where: { memberId: member.id } });
    await prisma.payment.deleteMany({ where: { sessionId: session.id } });
    await prisma.session.deleteMany({ where: { id: session.id } });
    await prisma.member.delete({ where: { id: member.id } });
    
    console.log('\n--- VERIFICATION COMPLETE ---');
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
