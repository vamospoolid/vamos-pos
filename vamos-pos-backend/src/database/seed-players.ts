import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (!tournament) {
        console.log("No tournament found!");
        return;
    }

    console.log(`Found tournament: ${tournament.name} (${tournament.id})`);

    // Delete existing participants
    await prisma.tournamentParticipant.deleteMany({
        where: { tournamentId: tournament.id }
    });
    await prisma.tournamentMatch.deleteMany({
        where: { tournamentId: tournament.id }
    });
    console.log('Cleared existing participants and matches for this tournament.');

    const participants = [];
    for (let i = 1; i <= 32; i++) {
        const phone = `08123456000${i.toString().padStart(2, '0')}`;
        let member = await prisma.member.findUnique({
            where: { phone }
        });

        if (!member) {
            member = await prisma.member.create({
                data: {
                    name: `Player ${i}`,
                    phone: phone,
                    loyaltyPoints: 0,
                }
            });
        }

        participants.push(member);
    }
    console.log('Created/Found 32 players.');

    let addedCount = 0;
    for (const player of participants) {
        try {
            await prisma.tournamentParticipant.create({
                data: {
                    tournamentId: tournament.id,
                    memberId: player.id,
                    paymentStatus: 'PAID'
                }
            });
            addedCount++;
        } catch (e: any) {
            console.log(`Failed to add player ${player.name}:`, e.message);
        }
    }

    console.log(`Successfully registered ${addedCount} participants to ${tournament.name}`);
}

main()
    .catch((e: any) => console.error(e))
    .finally(async () => await prisma.$disconnect());
