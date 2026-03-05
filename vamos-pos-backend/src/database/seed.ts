import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing database...');
    await prisma.matchMember.deleteMany();
    await prisma.match.deleteMany();
    await prisma.order.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.table.deleteMany();
    await prisma.pricingRule.deleteMany();
    await prisma.package.deleteMany();
    await prisma.product.deleteMany();
    await prisma.tournamentMatch.deleteMany();
    await prisma.tournamentParticipant.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.member.deleteMany();
    await prisma.venue.deleteMany();

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@vamos.pos' },
        update: {},
        create: {
            email: 'admin@vamos.pos',
            name: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    const kasirPassword = await bcrypt.hash('kasir123', 10);
    await prisma.user.upsert({
        where: { email: 'kasir@vamos.pos' },
        update: {},
        create: {
            email: 'kasir@vamos.pos',
            name: 'Kasir Utama',
            password: kasirPassword,
            role: 'KASIR',
        },
    });

    const venue = await prisma.venue.create({
        data: {
            name: 'Vamos Billiards - Serpong',
            address: 'Jl. M.H. Thamrin Kav 5, Serpong, Tangerang',
            openTime: '09:00',
            closeTime: '23:00'
        }
    });

    const tablesData = [];
    for (let i = 1; i <= 10; i++) {
        tablesData.push({
            name: `Table ${String(i).padStart(2, '0')}`,
            type: i <= 2 ? 'VVIP' : (i <= 4 ? 'VIP' : 'REGULAR'),
            venueId: venue.id,
            relayChannel: i
        });
    }

    await prisma.table.createMany({
        data: tablesData
    });

    await prisma.pricingRule.createMany({
        data: [
            { name: 'Regular Weekday', tableType: 'REGULAR', dayOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00', ratePerHour: 40000, isActive: true },
            { name: 'Regular Night', tableType: 'REGULAR', dayOfWeek: [1, 2, 3, 4, 5], startTime: '18:00', endTime: '23:59', ratePerHour: 55000, isActive: true },
            { name: 'VIP All Day', tableType: 'VIP', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59', ratePerHour: 80000, isActive: true },
            { name: 'VVIP All Day', tableType: 'VVIP', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59', ratePerHour: 120000, isActive: true },
        ]
    });

    await prisma.package.createMany({
        data: [
            { name: 'Ngebul Package (3 Hrs)', duration: 180, price: 100000, memberPrice: 85000, tableType: 'REGULAR', isActive: true },
            { name: 'VIP Night Long (4 Hrs)', duration: 240, price: 300000, memberPrice: 250000, tableType: 'VIP', isActive: true },
            { name: 'Lunch Break (2 Hrs)', duration: 120, price: 70000, memberPrice: 60000, tableType: 'REGULAR', isActive: true },
            { name: 'Sultan Promo (5 Hrs)', duration: 300, price: 500000, memberPrice: 420000, tableType: 'VVIP', isActive: true },
            { name: 'Midnight Marathon (6 Hrs)', duration: 360, price: 180000, memberPrice: 150000, tableType: 'REGULAR', isActive: true },
        ]
    });

    await prisma.product.createMany({
        data: [
            { name: 'AIR MINERAL', price: 5000, stock: 24, category: 'Beverage (Minuman)' },
            { name: 'BUTTERSCOOT ICE', price: 18000, stock: 24, category: 'Beverage (Minuman)' },
            { name: 'ICE COFFEE GULA ARENT', price: 18000, stock: 24, category: 'Beverage (Minuman)' },
            { name: 'ICE COFFEE VAMOS', price: 15000, stock: 20, category: 'Beverage (Minuman)' },
        ]
    });

    await prisma.member.createMany({
        data: [
            { name: 'John Doe', phone: '08123456789', loyaltyPoints: 150, totalWins: 5 },
            { name: 'Budi Santoso', phone: '08561234567', loyaltyPoints: 50, totalWins: 1 },
            { name: 'Agus Pratama', phone: '08119876543', loyaltyPoints: 220, totalWins: 12 },
            { name: 'Rina Wijaya', phone: '08134567890', loyaltyPoints: 30, totalWins: 0 },
            { name: 'Dewi Lestari', phone: '087811223344', loyaltyPoints: 80, totalWins: 2 },
            { name: 'Hendra Setiawan', phone: '082233445566', loyaltyPoints: 500, totalWins: 25 },
        ]
    });

    // Seed Tournaments
    const tournament1 = await prisma.tournament.create({
        data: {
            name: 'Grand Billiard Cup 2026',
            description: 'Turnamen billiard tahunan terbesar di Vamos! Rasakan sensasi kompetisi tingkat tinggi.',
            status: 'ONGOING',
            entryFee: 150000,
            prizePool: 10000000,
            prizeChampion: 5000000,
            prizeRunnerUp: 2500000,
            maxPlayers: 32,
            format: '8-Ball Single Elimination',
            startDate: new Date('2026-02-15'),
            endDate: new Date('2026-03-01'),
        }
    });

    const tournament2 = await prisma.tournament.create({
        data: {
            name: 'Weekly Rookie Battle',
            description: 'Khusus untuk para pemula yang ingin mengasah skill berkompetisi.',
            status: 'PENDING',
            entryFee: 50000,
            prizePool: 2000000,
            prizeChampion: 1000000,
            prizeRunnerUp: 500000,
            maxPlayers: 16,
            format: '9-Ball Round Robin',
            startDate: new Date('2026-03-10'),
        }
    });

    const members = await prisma.member.findMany({ take: 3 });
    for (const member of members) {
        await prisma.tournamentParticipant.create({
            data: {
                tournamentId: tournament1.id,
                memberId: member.id,
                name: member.name,
                handicap: '4',
                paymentStatus: 'PAID',
            }
        });
    }

    // Seed an Active Session for the first member
    const firstTable = await prisma.table.findFirst({ where: { type: 'REGULAR' } });
    if (members[0] && firstTable) {
        const session = await prisma.session.create({
            data: {
                memberId: members[0].id,
                tableId: firstTable.id,
                status: 'ACTIVE',
                startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
                customerName: members[0].name,
            }
        });

        const product = await prisma.product.findFirst({ where: { category: 'Beverage' } });
        if (product) {
            await prisma.order.create({
                data: {
                    sessionId: session.id,
                    productId: product.id,
                    quantity: 2,
                    price: product.price,
                    total: product.price * 2
                }
            });
        }

        await prisma.table.update({
            where: { id: firstTable.id },
            data: { status: 'PLAYING' }
        });
    }

    console.log('Seed completed!');


}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
