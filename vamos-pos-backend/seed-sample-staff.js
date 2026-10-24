const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Ensure WorkShift exists
    let shift = await prisma.workShift.findFirst();
    if (!shift) {
        shift = await prisma.workShift.create({
            data: {
                name: 'Shift Siang (15:00 - 23:00)',
                startTime: '15:00',
                endTime: '23:00',
                graceLateMinutes: 15
            }
        });
        console.log('WorkShift created:', shift.name);
    }

    // 2. Ensure Venue exists with coordinates
    let venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
    if (venue) {
        await prisma.venue.update({
            where: { id: venue.id },
            data: {
                latitude: -8.6500,
                longitude: 115.2166,
                attendanceRadiusMeters: 100
            }
        });
        console.log('Venue location updated:', venue.name);
    }

    // 3. Upsert Sample Staff (Waitress)
    const existing = await prisma.employee.findFirst({
        where: { phone: '628123456789' }
    });

    const jobdeskText = `1. Melayani customer dengan 5S (Senyum, Sapa, Salam, Sopan, Santun).\n2. Memeriksa kebersihan meja biliar, stick & bola.\n3. Menginput pesanan FnB meja secara cepat & teliti.\n4. Siap siaga di area kerja selama jam shift berlangsung.`;

    if (existing) {
        const updated = await prisma.employee.update({
            where: { id: existing.id },
            data: {
                pinCode: '1234',
                status: 'ACTIVE',
                approvalStatus: 'APPROVED',
                jobdesk: jobdeskText,
                shiftId: shift.id
            }
        });
        console.log('Updated staff:', updated.name, updated.phone, 'PIN:', updated.pinCode);
    } else {
        const created = await prisma.employee.create({
            data: {
                name: 'Rian Pratama (Waiter)',
                position: 'Waitress',
                phone: '628123456789',
                pinCode: '1234',
                status: 'ACTIVE',
                approvalStatus: 'APPROVED',
                salary: 3000000,
                jobdesk: jobdeskText,
                shiftId: shift.id
            }
        });
        console.log('Created sample staff:', created.name, created.phone, 'PIN:', created.pinCode);
    }

    // 4. Create another staff for leaderboard comparison
    const staff2 = await prisma.employee.upsert({
        where: { phone: '628198765432' },
        update: { approvalStatus: 'APPROVED', pinCode: '1234', shiftId: shift.id },
        create: {
            name: 'Siti Rahma (Barista)',
            position: 'Kitchen',
            phone: '628198765432',
            pinCode: '1234',
            status: 'ACTIVE',
            approvalStatus: 'APPROVED',
            salary: 3200000,
            shiftId: shift.id,
            jobdesk: '1. Membuat pesanan minuman & kopi sesuai standar resep.\n2. Menjaga kebersihan area bar & mesin kopi.'
        }
    });
    console.log('Sample Staff 2 ready:', staff2.name);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
