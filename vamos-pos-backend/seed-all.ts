import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    console.log('--- SEEDING BASIC DATA ---');

    // 1. Create Venue
    let venue = await prisma.venue.findFirst();
    if (!venue) {
        venue = await prisma.venue.create({
            data: {
                name: 'VAMOS ELITE ARENA',
                address: 'Jakarta, Indonesia',
                openTime: '09:00',
                closeTime: '02:00'
            }
        });
        console.log('Created Venue:', venue.name);
    } else {
        console.log('Venue already exists:', venue.name);
    }

    // 2. Create Tables
    const tableData = [
        { name: 'Table 01', type: 'REGULAR', relayChannel: 1 },
        { name: 'Table 02', type: 'REGULAR', relayChannel: 2 },
        { name: 'Table 03', type: 'REGULAR', relayChannel: 3 },
        { name: 'Table 04', type: 'REGULAR', relayChannel: 4 },
        { name: 'Table 05', type: 'REGULAR', relayChannel: 5 },
        { name: 'Table 06', type: 'REGULAR', relayChannel: 6 },
        { name: 'Table 07', type: 'VIP', relayChannel: 7 },
        { name: 'Table 08', type: 'VIP', relayChannel: 8 },
        { name: 'Table 09', type: 'VVIP', relayChannel: 9 },
        { name: 'Table 10', type: 'VVIP', relayChannel: 10 },
    ];

    for (const t of tableData) {
        const existingTable = await prisma.table.findFirst({
            where: { venueId: venue.id, relayChannel: t.relayChannel, deletedAt: null }
        });
        if (!existingTable) {
            await prisma.table.create({
                data: {
                    ...t,
                    venueId: venue.id,
                    status: 'AVAILABLE'
                }
            });
            console.log('Created Table:', t.name);
        }
    }

    // 3. Create Pricing Rules (for fallback/Open Time)
    const rules = [
        // Regular
        { name: 'Regular Day', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '18:00', ratePerHour: 25000, memberRatePerHour: 20000 },
        { name: 'Regular Night', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '18:00', endTime: '02:00', ratePerHour: 35000, memberRatePerHour: 30000 },
        // VIP
        { name: 'VIP Day', tableType: 'VIP', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '18:00', ratePerHour: 50000, memberRatePerHour: 45000 },
        { name: 'VIP Night', tableType: 'VIP', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '18:00', endTime: '02:00', ratePerHour: 70000, memberRatePerHour: 60000 },
    ];

    for (const r of rules) {
        const existing = await prisma.pricingRule.findFirst({ where: { name: r.name, deletedAt: null } });
        if (!existing) {
            await prisma.pricingRule.create({ data: r });
            console.log('Created Pricing Rule:', r.name);
        }
    }

    // 4. Create Packages
    const packages = [
        { name: 'PAKET 2 JAM SIANG', tableType: 'REGULAR', duration: 120, price: 50000, memberPrice: 40000, startTime: '09:00', endTime: '17:00' },
        { name: 'PAKET 3 JAM MALAM', tableType: 'REGULAR', duration: 180, price: 100000, memberPrice: 85000, startTime: '18:00', endTime: '23:00' },
        { name: 'VIP SPECIAL 2H', tableType: 'VIP', duration: 120, price: 120000, memberPrice: 100000 },
    ];

    for (const p of packages) {
        const existing = await prisma.package.findFirst({ where: { name: p.name, deletedAt: null } });
        if (!existing) {
            await prisma.package.create({ data: { ...p, isActive: true } });
            console.log('Created Package:', p.name);
        }
    }

    console.log('--- SEEDING COMPLETED ---');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
