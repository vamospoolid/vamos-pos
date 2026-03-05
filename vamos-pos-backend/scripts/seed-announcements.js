const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.announcement.createMany({
        data: [
            {
                title: 'GRAND OPENING: ARENA HUB',
                content: 'Join us this Friday for the official opening of our new VIP zone! Free XP for first 50 members.',
                priority: 10,
                isActive: true
            },
            {
                title: 'TOURNAMENT ALERT',
                content: '9-Ball Series starts next week. Registration now open in the app.',
                priority: 5,
                isActive: true
            }
        ]
    });
    console.log('Seeded announcements');
}
main().finally(() => prisma.$disconnect());
