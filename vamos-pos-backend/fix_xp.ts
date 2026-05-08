import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixXP() {
    console.log('Fetching all members...');
    const members = await prisma.member.findMany({
        where: { deletedAt: null }
    });

    let fixedCount = 0;
    
    for (const member of members) {
        if (member.level > 1) {
            // Calculate true cumulative XP
            const baseXP = ((member.level - 1) * member.level * 1000) / 2;
            const trueXP = member.experience + baseXP;
            
            console.log(`Fixing Member ${member.name} (Lvl ${member.level}): Old XP = ${member.experience}, True XP = ${trueXP}`);
            
            await prisma.member.update({
                where: { id: member.id },
                data: { experience: trueXP }
            });
            fixedCount++;
        }
    }
    
    console.log(`Successfully fixed XP for ${fixedCount} members.`);
}

fixXP()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
