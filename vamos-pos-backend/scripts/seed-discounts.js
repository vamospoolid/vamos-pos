const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding discount categories...");
    await prisma.discountCategory.createMany({
        data: [
            { name: 'Member Special 10%', type: 'PERCENTAGE', value: 10, description: 'Standard member discount' },
            { name: 'Happy Hour 20%', type: 'PERCENTAGE', value: 20, description: 'Afternoon session discount' },
            { name: 'Staff Relief', type: 'FIXED', value: 5000, description: 'Flat staff discount' },
            { name: 'Tournament Winner Free', type: 'PERCENTAGE', value: 100, description: 'Full coverage for tournament winners' }
        ]
    });
    console.log("Discount categories seeded.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
