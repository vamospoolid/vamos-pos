const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE OVERVIEW ---');
    console.log('TABLES:', await prisma.table.count());
    console.log('MEMBERS:', await prisma.member.count());
    console.log('TOURNAMENTS:', await prisma.tournament.count());
    console.log('REWARDS:', await prisma.reward.count());
    console.log('WAITLIST/BOOKINGS:', await prisma.waitlist.count());
    console.log('SESSIONS:', await prisma.session.count());

    const latestMember = await prisma.member.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log('\nLATEST MEMBER:', latestMember ? JSON.stringify(latestMember) : 'NONE');

    const activeTournaments = await prisma.tournament.findMany({ where: { status: 'PENDING' } });
    console.log('ACTIVE TOURNAMENTS (PENDING):', activeTournaments.length);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
