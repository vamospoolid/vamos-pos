import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Primary admin (original)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@vamos.pos' },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: { name: 'Admin Vamos', email: 'admin@vamos.pos', password: hashedPassword, role: 'ADMIN' },
    });
    console.log('Admin user created/updated:', admin.email);

    // Alias admin (for convenience)
    const admin2 = await prisma.user.upsert({
        where: { email: 'admin@vamos.com' },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: { name: 'Admin Vamos', email: 'admin@vamos.com', password: hashedPassword, role: 'ADMIN' },
    });
    console.log('Admin alias created/updated:', admin2.email);


    // Initialize a mock venue
    const venue = await prisma.venue.upsert({
        where: { id: 'default-venue-id' },
        update: {},
        create: {
            name: 'Vamos POS Main Venue',
            id: 'default-venue-id'
        }
    });

    // Ensure some tables exist for the dashboard
    for (let i = 1; i <= 8; i++) {
        await prisma.table.upsert({
            where: { id: `table-0${i}` },
            update: {},
            create: {
                id: `table-0${i}`,
                venueId: venue.id,
                name: `Table 0${i}`,
                type: i > 6 ? 'VIP' : 'REGULAR',
                status: 'AVAILABLE',
                relayChannel: i
            }
        });
    }
    console.log('Tables initialized');

    // Some products
    await prisma.product.upsert({
        where: { id: 'prod-es-teh' },
        update: {},
        create: {
            id: 'prod-es-teh', name: 'Es Teh Manis', price: 10000, stock: 100, category: 'Beverage'
        }
    });
    await prisma.product.upsert({
        where: { id: 'prod-kopi' },
        update: {},
        create: {
            id: 'prod-kopi', name: 'Kopi Hitam', price: 15000, stock: 50, category: 'Beverage'
        }
    });
    await prisma.product.upsert({
        where: { id: 'prod-nasi' },
        update: {},
        create: {
            id: 'prod-nasi', name: 'Nasi Goreng Spesial', price: 25000, stock: 30, category: 'Food'
        }
    });
    console.log('Products initialized');

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
