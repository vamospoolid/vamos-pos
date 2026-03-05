import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating packages with time constraints...');

    // Update existing packages to have logical time ranges
    // Ngebul (3h) - All day
    await prisma.package.updateMany({
        where: { name: { contains: 'Ngebul' } },
        data: {
            startTime: '00:00',
            endTime: '23:59',
            dayOfWeek: [0, 1, 2, 3, 4, 5, 6]
        }
    });

    // Lunch Break (2h) - 10:00 to 16:00
    await prisma.package.updateMany({
        where: { name: { contains: 'Lunch' } },
        data: {
            startTime: '10:00',
            endTime: '16:00',
            dayOfWeek: [1, 2, 3, 4, 5]
        }
    });

    // Night Long (4h) - 17:00 to 23:59
    await prisma.package.updateMany({
        where: { name: { contains: 'Night' } },
        data: {
            startTime: '17:00',
            endTime: '23:59',
            dayOfWeek: [0, 1, 2, 3, 4, 5, 6]
        }
    });

    // Midnight Marathon (6h) - 21:00 to 04:00 (spans midnight)
    await prisma.package.updateMany({
        where: { name: { contains: 'Midnight' } },
        data: {
            startTime: '21:00',
            endTime: '04:00',
            dayOfWeek: [0, 1, 2, 3, 4, 5, 6]
        }
    });

    console.log('Update completed.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
