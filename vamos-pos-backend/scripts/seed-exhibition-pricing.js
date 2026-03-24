const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Exhibition Pricing Rule...');
    
    // Check if it already exists
    const existing = await prisma.pricingRule.findFirst({
        where: { tableType: 'EXEBITION', isActive: true, deletedAt: null }
    });

    if (existing) {
        console.log('⚠️ Exhibition Pricing Rule already exists. Updating...');
        await prisma.pricingRule.update({
            where: { id: existing.id },
            data: {
                ratePerHour: 30000,
                memberRatePerHour: 30000, // same for now as per user request (500/min)
            }
        });
    } else {
        await prisma.pricingRule.create({
            data: {
                name: 'Exhibition Regular',
                tableType: 'EXEBITION',
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: '00:00',
                endTime: '23:59',
                ratePerHour: 30000,
                memberRatePerHour: 30000,
                isActive: true
            }
        });
        console.log('✅ Exhibition Pricing Rule created!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
