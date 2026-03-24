const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const challenge = await prisma.matchChallenge.create({
            data: {
                challengerId: "invalid-id",
                opponentId: "invalid-id-2",
                pointsStake: 50,
                isFightForTable: false,
                sessionId: null,
                status: 'PENDING'
            },
            include: { challenger: true, opponent: true }
        });
        console.log("Success:", challenge);
    } catch (e) {
        console.error("PRISMA ERROR CATCH:");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}
test();
