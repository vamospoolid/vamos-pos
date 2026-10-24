const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Memulai Seeding Meja Biliar & Menu FnB Lengkap...');

    // 1. Get or Create Venue
    let venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
    if (!venue) {
        venue = await prisma.venue.create({
            data: {
                name: 'Vamos Pool & Cafe',
                address: 'Jl. Pemuda No. 88, Denpasar',
                openTime: '09:00',
                closeTime: '02:00',
                latitude: -8.6500,
                longitude: 115.2166,
                attendanceRadiusMeters: 100
            }
        });
        console.log('Venue created:', venue.name);
    }

    // 2. Seed 10 Billiard Tables + 4 Cafe Tables
    const tableData = [
        { name: 'Meja 01', type: 'REGULAR', relayChannel: 1, area: 'Arena Biliar' },
        { name: 'Meja 02', type: 'REGULAR', relayChannel: 2, area: 'Arena Biliar' },
        { name: 'Meja 03', type: 'REGULAR', relayChannel: 3, area: 'Arena Biliar' },
        { name: 'Meja 04', type: 'REGULAR', relayChannel: 4, area: 'Arena Biliar' },
        { name: 'Meja 05', type: 'REGULAR', relayChannel: 5, area: 'Arena Biliar' },
        { name: 'Meja 06', type: 'REGULAR', relayChannel: 6, area: 'Arena Biliar' },
        { name: 'Meja 07', type: 'REGULAR', relayChannel: 7, area: 'Arena Biliar' },
        { name: 'Meja 08', type: 'REGULAR', relayChannel: 8, area: 'Arena Biliar' },
        { name: 'Meja 09 (VIP)', type: 'VIP', relayChannel: 9, area: 'VIP Lounge' },
        { name: 'Meja 10 (VVIP)', type: 'VVIP', relayChannel: 10, area: 'VVIP Room' },
        { name: 'Cafe Meja A1', type: 'CAFE', relayChannel: 11, area: 'Cafe & Bar' },
        { name: 'Cafe Meja A2', type: 'CAFE', relayChannel: 12, area: 'Cafe & Bar' },
        { name: 'Cafe Meja A3', type: 'CAFE', relayChannel: 13, area: 'Cafe & Bar' },
        { name: 'Cafe Bar Counter', type: 'CAFE', relayChannel: 14, area: 'Bar Area' },
    ];

    for (const t of tableData) {
        const existing = await prisma.table.findFirst({
            where: { venueId: venue.id, name: t.name, deletedAt: null }
        });
        if (!existing) {
            await prisma.table.create({
                data: {
                    name: t.name,
                    type: t.type,
                    area: t.area,
                    relayChannel: t.relayChannel,
                    venueId: venue.id,
                    status: 'AVAILABLE'
                }
            });
            console.log('✅ Table created:', t.name);
        }
    }

    // 3. Seed FnB Products across all categories
    const productsData = [
        // MINUMAN (Kopi Barista Wawan & Refreshing Drink)
        { name: 'Kopi Susu Gula Aren (Signature)', category: 'MINUMAN', price: 18000, stock: 150 },
        { name: 'Americano Ice / Hot', category: 'MINUMAN', price: 15000, stock: 120 },
        { name: 'Caramel Macchiato', category: 'MINUMAN', price: 22000, stock: 90 },
        { name: 'Es Lemon Tea Segar', category: 'MINUMAN', price: 12000, stock: 200 },
        { name: 'Lychee Tea Dingin', category: 'MINUMAN', price: 15000, stock: 150 },
        { name: 'Air Mineral 600ml', category: 'MINUMAN', price: 8000, stock: 300 },
        { name: 'Coca Cola / Sprite Dingin', category: 'MINUMAN', price: 10000, stock: 180 },
        { name: 'Kratingdaeng / Redbull', category: 'MINUMAN', price: 15000, stock: 100 },

        // MAKANAN (Kitchen Nadia)
        { name: 'Nasi Goreng Spesial Vamos', category: 'MAKANAN', price: 25000, stock: 80 },
        { name: 'Mie Goreng / Kuah Telur Kornet', category: 'MAKANAN', price: 18000, stock: 100 },
        { name: 'Rice Bowl Ayam Sambal Matah', category: 'MAKANAN', price: 28000, stock: 60 },
        { name: 'Rice Bowl Beef Teriyaki', category: 'MAKANAN', price: 32000, stock: 50 },

        // SNACK (Camilan Meja)
        { name: 'French Fries (Kentang Goreng)', category: 'SNACK', price: 18000, stock: 120 },
        { name: 'Sosis Bakar Jumbo BBQ', category: 'SNACK', price: 20000, stock: 90 },
        { name: 'Platter Mix (Nugget, Sosis, Fries)', category: 'SNACK', price: 35000, stock: 70 },
        { name: 'Tahu Crispy Cabai Garam', category: 'SNACK', price: 15000, stock: 100 },
        { name: 'Cireng Rujak Pedas Gurih', category: 'SNACK', price: 15000, stock: 80 },

        // ROKOK
        { name: 'Surya 16', category: 'ROKOK', price: 35000, stock: 50 },
        { name: 'Marlboro Red / Filter Black', category: 'ROKOK', price: 42000, stock: 40 },
        { name: 'Sampoerna Mild 16', category: 'ROKOK', price: 36000, stock: 50 },
        { name: 'Esse Change Grape', category: 'ROKOK', price: 40000, stock: 40 },
    ];

    for (const p of productsData) {
        const existing = await prisma.product.findFirst({
            where: { name: p.name, deletedAt: null }
        });
        if (!existing) {
            await prisma.product.create({
                data: {
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    stock: p.stock
                }
            });
            console.log('🍔 Product created:', p.name, `(${p.category}) - Rp ${p.price}`);
        } else {
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    category: p.category,
                    price: p.price,
                    stock: p.stock
                }
            });
        }
    }

    console.log('🎉 14 Meja Biliar & Cafe + 20 Menu FnB Berhasil Disinkronkan!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
