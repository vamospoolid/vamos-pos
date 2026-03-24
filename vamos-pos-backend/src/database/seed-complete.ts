import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔥 Starting complete database seed...');

    // ============================================================
    // 1. USERS
    // ============================================================
    const adminPassword = await bcrypt.hash('admin123', 10);
    const kasirPassword = await bcrypt.hash('kasir123', 10);
    const ownerPassword = await bcrypt.hash('owner123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@vamos.pos' },
        update: { password: adminPassword },
        create: { email: 'admin@vamos.pos', name: 'Admin', password: adminPassword, role: 'ADMIN' },
    });

    await prisma.user.upsert({
        where: { email: 'kasir@vamos.pos' },
        update: { password: kasirPassword },
        create: { email: 'kasir@vamos.pos', name: 'Kasir Utama', password: kasirPassword, role: 'KASIR' },
    });

    await prisma.user.upsert({
        where: { email: 'owner@vamos.pos' },
        update: { password: ownerPassword },
        create: { email: 'owner@vamos.pos', name: 'Owner', password: ownerPassword, role: 'OWNER' },
    });

    console.log('✅ Users seeded');

    // ============================================================
    // 2. VENUE
    // ============================================================
    let venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
    if (!venue) {
        venue = await prisma.venue.create({
            data: {
                name: 'VAMOS POOL AND CAFE',
                address: 'Kompleks Perumahan Balanipa Residence Wonomulyo',
                openTime: '09:00',
                closeTime: '07:00',
                relayComPort: 'COM4',
                printerPath: 'USB001',
            }
        });
    }
    console.log('✅ Venue seeded:', venue.name);

    // ============================================================
    // 3. TABLES
    // ============================================================
    const existingTablesCount = await prisma.table.count({ where: { deletedAt: null } });
    if (existingTablesCount === 0) {
        const tablesData = [
            { name: 'Table 01', type: 'REGULAR', relayChannel: 1 },
            { name: 'Table 02', type: 'REGULAR', relayChannel: 2 },
            { name: 'Table 03', type: 'REGULAR', relayChannel: 3 },
            { name: 'Table 04', type: 'REGULAR', relayChannel: 4 },
            { name: 'Table 05', type: 'REGULAR', relayChannel: 5 },
            { name: 'Table 06', type: 'REGULAR', relayChannel: 6 },
            { name: 'Table 07', type: 'REGULAR', relayChannel: 7 },
            { name: 'Table 08', type: 'REGULAR', relayChannel: 8 },
            { name: 'Table 09', type: 'REGULAR', relayChannel: 9 },
            { name: 'Table 10', type: 'REGULAR', relayChannel: 10 },
        ];
        await prisma.table.createMany({
            data: tablesData.map(t => ({ ...t, venueId: venue!.id, status: 'AVAILABLE' }))
        });
    }
    console.log('✅ Tables seeded');

    // ============================================================
    // 4. PRICING RULES
    // ============================================================
    const existingRules = await prisma.pricingRule.count({ where: { deletedAt: null } });
    if (existingRules === 0) {
        await prisma.pricingRule.createMany({
            data: [
                { name: 'Dini Hari Regular', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '07:00', ratePerHour: 30000, memberRatePerHour: 30000, isActive: true },
                { name: 'Malam Regular', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '17:00', endTime: '02:00', ratePerHour: 35000, memberRatePerHour: 35000, isActive: true },
                { name: 'Siang Regular', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '17:00', ratePerHour: 25000, memberRatePerHour: 22000, isActive: true },
                { name: 'EXEBITION', tableType: 'REGULAR', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '17:00', endTime: '04:59', ratePerHour: 30000, memberRatePerHour: 30000, isActive: true },
            ]
        });
    }
    console.log('✅ Pricing rules seeded');

    // ============================================================
    // 5. PACKAGES
    // ============================================================
    const existingPkg = await prisma.package.count({ where: { deletedAt: null } });
    if (existingPkg === 0) {
        await prisma.package.createMany({
            data: [
                { name: 'Paket Malam 2 Jam', tableType: 'REGULAR', duration: 120, price: 50000, memberPrice: 50000, startTime: '17:00', endTime: '02:00', isActive: true, dayOfWeek: [1, 2, 3, 4, 5] },
                { name: 'Paket Malam 3 Jam', tableType: 'REGULAR', duration: 180, price: 75000, memberPrice: 75000, startTime: '17:00', endTime: '02:00', isActive: true, dayOfWeek: [0, 1, 2, 3, 4, 5, 6] },
                { name: 'MIDNIGHT PACKAGE', tableType: 'REGULAR', duration: 60, price: 25000, memberPrice: 25000, startTime: '02:00', endTime: '07:59', isActive: true, dayOfWeek: [0, 1, 2, 3, 4, 5, 6] },
                { name: 'EXEBITION', tableType: 'REGULAR', duration: 60, price: 30000, memberPrice: 30000, startTime: '17:00', endTime: '02:00', isActive: true, dayOfWeek: [0, 1, 2, 3, 4, 5, 6] },
            ]
        });
    }
    console.log('✅ Packages seeded');

    // ============================================================
    // 6. PRODUCTS
    // ============================================================
    const existingProducts = await prisma.product.count({ where: { deletedAt: null } });
    if (existingProducts === 0) {
        await prisma.product.createMany({
            data: [
                { name: 'AIR MINERAL', price: 5000, stock: 59, category: 'Beverage (Minuman)' },
                { name: 'BUTTERSCOOT ICE', price: 18000, stock: 48, category: 'Beverage (Minuman)' },
                { name: 'ICE COFFEE GULA ARENT', price: 18000, stock: 11, category: 'Beverage (Minuman)' },
                { name: 'ICE COFFEE VAMOS', price: 15000, stock: 44, category: 'Beverage (Minuman)' },
            ]
        });
    }
    console.log('✅ Products seeded');

    // ============================================================
    // 7. MEMBERS
    // ============================================================
    const existingMembers = await prisma.member.count({ where: { deletedAt: null } });
    if (existingMembers === 0) {
        await prisma.member.createMany({
            data: [
                { name: 'John Doe', phone: '08123456789', email: 'john@example.com', loyaltyPoints: 500, tier: 'SILVER', totalWins: 5, totalMatches: 20, totalPlayHours: 40 },
                { name: 'Budi Santoso', phone: '08561234567', loyaltyPoints: 150, tier: 'BRONZE', totalWins: 3, totalMatches: 10, totalPlayHours: 15 },
                { name: 'Agus Pratama', phone: '08119876543', loyaltyPoints: 1200, tier: 'GOLD', totalWins: 25, totalMatches: 60, totalPlayHours: 120 },
                { name: 'Rina Wijaya', phone: '08134567890', loyaltyPoints: 50, tier: 'BRONZE', totalWins: 0, totalMatches: 5, totalPlayHours: 8 },
                { name: 'Dewi Lestari', phone: '087811223344', loyaltyPoints: 300, tier: 'SILVER', totalWins: 8, totalMatches: 30, totalPlayHours: 55 },
                { name: 'Hendra Setiawan', phone: '082233445566', loyaltyPoints: 2500, tier: 'PLATINUM', totalWins: 40, totalMatches: 100, totalPlayHours: 200 },
                { name: 'Fani Fitriani', phone: '081299887766', loyaltyPoints: 100, tier: 'BRONZE', totalWins: 1, totalMatches: 4, totalPlayHours: 6 },
                { name: 'Eko Wahyudi', phone: '085711223344', loyaltyPoints: 450, tier: 'SILVER', totalWins: 12, totalMatches: 40, totalPlayHours: 80 },
                { name: 'Gita Permata', phone: '089900112233', loyaltyPoints: 800, tier: 'GOLD', totalWins: 18, totalMatches: 50, totalPlayHours: 95 },
                { name: 'Irfan Hakim', phone: '081566778899', loyaltyPoints: 200, tier: 'BRONZE', totalWins: 4, totalMatches: 15, totalPlayHours: 25 },
            ]
        });
    }
    console.log('✅ Members seeded');

    // ============================================================
    // 8. LOYALTY CONFIG
    // ============================================================
    await prisma.loyaltyConfig.upsert({
        where: { id: 'global' },
        update: {},
        create: {
            id: 'global',
            doublePointEnabled: false,
            pointPerRupiah: 0.001,
            streakThreshold: 5,
            streakWindowDays: 30,
            streakBonusPoints: 100,
        }
    });
    console.log('✅ Loyalty config seeded');

    // ============================================================
    // 9. REWARDS
    // ============================================================
    const existingRewards = await prisma.reward.count();
    if (existingRewards === 0) {
        await prisma.reward.createMany({
            data: [
                { title: 'Diskon 10% Meja', description: 'Diskon 10% untuk sewa meja berikutnya', pointsRequired: 100, rewardType: 'DISCOUNT', value: 10, stock: 999, isActive: true },
                { title: 'Game Gratis 1 Jam', description: 'Sewa meja gratis 1 jam untuk meja Regular', pointsRequired: 500, rewardType: 'FREE_GAME', value: 1, stock: 50, isActive: true },
                { title: 'Voucher FnB 25rb', description: 'Voucher makanan & minuman senilai Rp 25.000', pointsRequired: 250, rewardType: 'FNB_VOUCHER', value: 25000, stock: 100, isActive: true },
                { title: 'Akses Meja VIP', description: 'Upgrade ke meja VIP gratis untuk 2 jam', pointsRequired: 800, rewardType: 'VIP_ACCESS', value: 2, stock: 30, isActive: true },
                { title: 'Diskon 20% Member', description: 'Diskon spesial 20% khusus member Gold ke atas', pointsRequired: 300, rewardType: 'DISCOUNT', value: 20, stock: 999, isActive: true },
            ]
        });
    }
    console.log('✅ Rewards seeded');

    // ============================================================
    // 10. EMPLOYEES
    // ============================================================
    const existingEmployees = await prisma.employee.count({ where: { deletedAt: null } });
    if (existingEmployees === 0) {
        await prisma.employee.createMany({
            data: [
                { name: 'Ahmad Fauzi', position: 'Kasir', phone: '08123000001', email: 'ahmad@vamos.pos', salary: 3500000, status: 'ACTIVE' },
                { name: 'Siti Rahayu', position: 'Operator Meja', phone: '08123000002', email: 'siti@vamos.pos', salary: 3000000, status: 'ACTIVE' },
                { name: 'Budi Hartono', position: 'Supervisor', phone: '08123000003', salary: 5000000, status: 'ACTIVE' },
                { name: 'Rini Kusuma', position: 'Kasir', phone: '08123000004', salary: 3200000, status: 'ACTIVE' },
            ]
        });
    }
    console.log('✅ Employees seeded');

    // ============================================================
    // 11. EXPENSES
    // ============================================================
    const existingExpenses = await prisma.expense.count({ where: { deletedAt: null } });
    if (existingExpenses === 0) {
        const now = new Date();
        await prisma.expense.createMany({
            data: [
                { category: 'Operasional', amount: 500000, description: 'Beli sabun cuci dan peralatan kebersihan', date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                { category: 'Listrik', amount: 2500000, description: 'Tagihan listrik bulan Februari', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
                { category: 'Gaji', amount: 14700000, description: 'Gaji karyawan bulan Februari', date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
                { category: 'Perbaikan', amount: 800000, description: 'Servis meja billiard nomor 3', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
                { category: 'Bahan Baku', amount: 1200000, description: 'Restok bahan makanan dan minuman', date: now },
            ]
        });
    }
    console.log('✅ Expenses seeded');

    // ============================================================
    // 12. ANNOUNCEMENTS
    // ============================================================
    const existingAnn = await prisma.announcement.count();
    if (existingAnn === 0) {
        await prisma.announcement.createMany({
            data: [
                { title: 'Grand Billiard Cup 2026 - Daftar Sekarang!', content: 'Jangan lewatkan turnamen terbesar tahun ini! Hadiah total Rp 10.000.000. Daftar sebelum penuh.', isActive: true, priority: 10 },
                { title: 'Double Point Weekend!', content: 'Setiap akhir pekan, kamu bisa earn 2x loyalty points! Berlaku untuk semua meja.', isActive: true, priority: 5 },
                { title: 'Selamat Datang di VAMOS ELITE ARENA', content: 'Nikmati fasilitas premium billiard, meja berkualitas, dan berbagai promo menarik khusus member.', isActive: true, priority: 1 },
            ]
        });
    }
    console.log('✅ Announcements seeded');

    // ============================================================
    // 13. DISCOUNT CATEGORIES
    // ============================================================
    const existingDisc = await prisma.discountCategory.count({ where: { deletedAt: null } });
    if (existingDisc === 0) {
        await prisma.discountCategory.createMany({
            data: [
                { name: 'Diskon Member', type: 'PERCENTAGE', value: 10, description: 'Diskon otomatis untuk anggota member', isActive: true },
                { name: 'Diskon Pelajar', type: 'PERCENTAGE', value: 15, description: 'Khusus pelajar dengan kartu pelajar', isActive: true },
                { name: 'Diskon Akhir Pekan', type: 'PERCENTAGE', value: 5, description: 'Diskon weekend untuk regular member', isActive: true },
                { name: 'Potongan Rp 25.000', type: 'FIXED', value: 25000, description: 'Potongan tetap untuk transaksi minimal 100rb', isActive: true },
            ]
        });
    }
    console.log('✅ Discount categories seeded');

    // ============================================================
    // 14. TOURNAMENT
    // ============================================================
    const existingTournaments = await prisma.tournament.count({ where: { deletedAt: null } });
    if (existingTournaments === 0) {
        await prisma.tournament.createMany({
            data: [
                {
                    name: 'Grand Billiard Cup 2026',
                    description: 'Turnamen billiard tahunan terbesar di Vamos!',
                    status: 'ONGOING',
                    entryFee: 150000,
                    prizePool: 10000000,
                    prizeChampion: 5000000,
                    prizeRunnerUp: 2500000,
                    prizeSemiFinal: 1000000,
                    maxPlayers: 32,
                    format: '8-Ball Single Elimination',
                    startDate: new Date('2026-02-15'),
                    endDate: new Date('2026-03-15'),
                },
                {
                    name: 'Weekly Rookie Battle',
                    description: 'Khusus untuk para pemula yang ingin mengasah skill.',
                    status: 'PENDING',
                    entryFee: 50000,
                    prizePool: 2000000,
                    prizeChampion: 1000000,
                    prizeRunnerUp: 500000,
                    maxPlayers: 16,
                    format: '9-Ball Round Robin',
                    startDate: new Date('2026-03-15'),
                },
            ]
        });
    }
    console.log('✅ Tournaments seeded');

    console.log('\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('  Admin:  admin@vamos.pos  /  admin123');
    console.log('  Kasir:  kasir@vamos.pos  /  kasir123');
    console.log('  Owner:  owner@vamos.pos  /  owner123');
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
