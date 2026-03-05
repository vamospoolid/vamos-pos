import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const members = await prisma.member.findMany({
        take: 10,
        orderBy: { loyaltyPoints: 'desc' }
    });
    console.log('--- MEMBERS ---');
    console.log(JSON.stringify(members.map(m => ({ name: m.name, points: m.loyaltyPoints })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
