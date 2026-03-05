const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rules = [
        { name: 'Regular Night (Auto)', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '18:00', endTime: '23:59', ratePerHour: 35000, memberRatePerHour: 35000, isActive: true },
        { name: 'Regular Day (Auto)', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '04:00', endTime: '18:00', ratePerHour: 25000, memberRatePerHour: 25000, isActive: true },
        { name: 'Night Overlap (Auto)', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '04:00', ratePerHour: 35000, memberRatePerHour: 35000, isActive: true }
    ];

    // Clear old auto rules
    await prisma.pricingRule.deleteMany({
        where: { name: { contains: '(Auto)' } }
    });

    for (const rule of rules) {
        await prisma.pricingRule.create({
            data: rule
        });
    }
    console.log('Pricing rules updated to 35k night / 25k day.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
