
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const venues = await prisma.venue.findMany();
        console.log('Venues:', JSON.stringify(venues, null, 2));
        const sessions = await prisma.session.findMany({ take: 5 });
        console.log('Sessions:', JSON.stringify(sessions, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
