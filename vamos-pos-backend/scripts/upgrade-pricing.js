const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const venue = await prisma.venue.findFirst();
    if (!venue) {
        console.log("No venue found. Please create a venue first.");
        return;
    }

    // Clear existing rules and packages to avoid duplicates for this demonstration
    await prisma.pricingRule.deleteMany({});
    await prisma.package.deleteMany({});

    console.log("Seeding refined pricing strategies...");

    // 1. DYNAMIC HOURLY RULES (Day vs Night)
    await prisma.pricingRule.createMany({
        data: [
            {
                name: 'Morning Sunshine (Regular)',
                tableType: 'REGULAR',
                dayOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '15:00',
                ratePerHour: 35000,
                memberRatePerHour: 25000
            },
            {
                name: 'Afternoon Prime (Regular)',
                tableType: 'REGULAR',
                dayOfWeek: [1, 2, 3, 4, 5],
                startTime: '15:00',
                endTime: '23:59',
                ratePerHour: 50000,
                memberRatePerHour: 40000
            },
            {
                name: 'Weekend Madness',
                tableType: 'REGULAR',
                dayOfWeek: [0, 6],
                startTime: '00:00',
                endTime: '23:59',
                ratePerHour: 60000,
                memberRatePerHour: 50000
            }
        ]
    });

    // 2. ENHANCED PROMO PACKAGES (F&B + Time Based)
    await prisma.package.createMany({
        data: [
            {
                name: 'Ngebul & Play (2 Hrs)',
                tableType: 'REGULAR',
                duration: 120,
                price: 80000,
                memberPrice: 70000,
                fnbItems: 'Free Teh Pucuk + Snack',
                startTime: '10:00',
                endTime: '16:00',
                dayOfWeek: [1, 2, 3, 4, 5]
            },
            {
                name: 'Midnight VIP Special (3 Hrs)',
                tableType: 'VIP',
                duration: 180,
                price: 250000,
                memberPrice: 200000,
                fnbItems: '2x Coffee / Beer + Platters',
                startTime: '21:00',
                endTime: '23:59',
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6]
            },
            {
                name: 'Elite Training (1 Hr)',
                tableType: 'REGULAR',
                duration: 60,
                price: 50000,
                memberPrice: 40000,
                fnbItems: 'Free Mineral Water',
                startTime: '09:00',
                endTime: '23:59',
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6]
            }
        ]
    });

    console.log("Pricing system upgraded successfully.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
