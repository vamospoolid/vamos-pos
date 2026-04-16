const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const members = await prisma.member.findMany({});
    console.log('Calculating play hours for ' + members.length + ' members...');
    
    let updatedCount = 0;
    for (const m of members) {
        const sessions = await prisma.session.findMany({
            where: { memberId: m.id, status: { in: ['FINISHED', 'PAID'] } }
        });
        
        let totalMs = 0;
        for (const s of sessions) {
            if (s.startTime && s.endTime) {
                totalMs += (s.endTime.getTime() - s.startTime.getTime());
            }
        }
        
        const hoursPlayed = totalMs / (1000 * 60 * 60);
        
        if (hoursPlayed > 0) {
            await prisma.member.update({
                where: { id: m.id },
                data: { totalPlayHours: Math.round(hoursPlayed * 100) / 100 }
            });
            updatedCount++;
        }
    }
    console.log('Done! Updated ' + updatedCount + ' members.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
