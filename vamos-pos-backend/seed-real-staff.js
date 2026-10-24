const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Menyinkronkan 7 Staf Resmi & SOP Standar Vamos Pool & Cafe...');

    // 1. Setup Shift Kerja Lengkap
    const shiftSiang = await prisma.workShift.upsert({
        where: { id: 'shift-siang-09-19' },
        update: { name: 'Shift Siang (09:00 - 19:00)', startTime: '09:00', endTime: '19:00', graceLateMinutes: 15 },
        create: { id: 'shift-siang-09-19', name: 'Shift Siang (09:00 - 19:00)', startTime: '09:00', endTime: '19:00', graceLateMinutes: 15 }
    });

    const shiftKitchen = await prisma.workShift.upsert({
        where: { id: 'shift-kitchen-16-24' },
        update: { name: 'Shift Dapur (16:00 - 24:00)', startTime: '16:00', endTime: '24:00', graceLateMinutes: 15 },
        create: { id: 'shift-kitchen-16-24', name: 'Shift Dapur (16:00 - 24:00)', startTime: '16:00', endTime: '24:00', graceLateMinutes: 15 }
    });

    const shiftWaiterSore = await prisma.workShift.upsert({
        where: { id: 'shift-waiter-16-02' },
        update: { name: 'Shift Waiter Sore (16:00 - 02:00)', startTime: '16:00', endTime: '02:00', graceLateMinutes: 15 },
        create: { id: 'shift-waiter-16-02', name: 'Shift Waiter Sore (16:00 - 02:00)', startTime: '16:00', endTime: '02:00', graceLateMinutes: 15 }
    });

    const shiftBaristaSore = await prisma.workShift.upsert({
        where: { id: 'shift-barista-16-02' },
        update: { name: 'Shift Barista & Closing (16:00 - 02:00)', startTime: '16:00', endTime: '02:00', graceLateMinutes: 15 },
        create: { id: 'shift-barista-16-02', name: 'Shift Barista & Closing (16:00 - 02:00)', startTime: '16:00', endTime: '02:00', graceLateMinutes: 15 }
    });

    const shiftMalamPeak = await prisma.workShift.upsert({
        where: { id: 'shift-malam-19-02' },
        update: { name: 'Shift Malam Peak (19:00 - 02:00)', startTime: '19:00', endTime: '02:00', graceLateMinutes: 15 },
        create: { id: 'shift-malam-19-02', name: 'Shift Malam Peak (19:00 - 02:00)', startTime: '19:00', endTime: '02:00', graceLateMinutes: 15 }
    });

    // 2. Data 7 Karyawan & SOP Terinci
    const staffList = [
        {
            name: 'ANTO',
            position: 'Kasir Siang & General Cleaning',
            phone: '6281200000001',
            pinCode: '1111',
            shiftId: shiftSiang.id,
            salary: 1300000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) ANTO:
1. Opening Pukul 09.00: Membuka outlet, menyalakan AC lounge, lampu biliar & cafe, serta menyalakan sistem POS kasir.
2. Kebersihan Total (Cleaning):
   - Menyapu & mengepel lantai biliar & cafe.
   - Mengelap seluruh meja biliar, menyikat kain laken dari debu kapur, membersihkan bola & merapikan stick.
   - Membersihkan toilet agar wangi dan siap pakai.
3. Kasir & Pelayanan Siang (09.00 - 19.00):
   - Menyambut tamu siang dengan 5S, membuka meja biliar tarif Rp 20.000/jam via POS.
   - Melayani pesanan minuman simpel siang (air mineral, es teh, kopi seduh, snack/mie instan).
4. Handover Pukul 19.00: Serah terima modal kasir & laporan ke Wulan.`
        },
        {
            name: 'NADIA',
            position: 'Head of Kitchen & Food Production',
            phone: '6281200000007',
            pinCode: '7777',
            shiftId: shiftKitchen.id,
            salary: 1200000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) NADIA:
1. Persiapan Dapur (Pukul 16.00): Cek kebersihan kompor, alat masak, minyak goreng, dan stok bahan (kentang, sosis, nugget, mie, bumbu).
2. Standar Produksi Makanan:
   - Memasak pesanan makanan sesuai KDS Dapur dengan porsi, rasa, dan kerapihan standar Vamos.
   - Kecepatan penyajian maksimal 10-15 menit per pesanan.
   - Selalu menjaga kebersihan area dapur dan mencuci tangan.
3. Closing Dapur (Pukul 24.00):
   - Mencuci seluruh peralatan masak dan membersihkan meja dapur.
   - Mematikan kompor gas & mencabut regulator demi keamanan.
   - Mencatat bahan baku yang menipis untuk belanja esok hari.`
        },
        {
            name: 'JEP',
            position: 'Senior Waiter & Cafe Host',
            phone: '6281200000002',
            pinCode: '2222',
            shiftId: shiftWaiterSore.id,
            salary: 1200000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) JEP:
1. Kesiapan Cafe Pukul 16.00: Memastikan seluruh meja cafe bersih, kursi tertata rapi, dan asbak bersih siap untuk tamu sore.
2. Pelayanan & Hospitality: Menyambut tamu cafe & biliar dengan senyum ramah (5S).
3. Order Taking & Up-Selling:
   - Menginput pesanan makanan/minuman tamu via Vamos Staff App.
   - Aktif menawarkan kopi barista Wawan dan snack masakan Nadia ke pengunjung cafe.
4. Table Maintenance: Rutin mengangkat piring/gelas kosong dan mengganti asbak penuh.
5. Closing Pukul 02.00: Membersihkan area cafe, menyapu, dan membuang sampah sebelum pulang.`
        },
        {
            name: 'WAWAN',
            position: 'Senior Barista & Closing Coordinator',
            phone: '6281200000006',
            pinCode: '6666',
            shiftId: shiftBaristaSore.id,
            salary: 1500000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) WAWAN:
1. Barista Quality Pukul 16.00: Menyalakan mesin espresso, cek stok biji kopi, susu, sirup, dan menjamin pasokan es batu selalu melimpah.
2. Meracik Minuman: Meracik kopi dan signature drink sesuai standar resep rasa Vamos.
3. Backup Kasir Dini Hari (02.00 - Selesai): Mengambil alih tugas kasir dari Wulan pukul 02.00 jika masih ada pemain aktif di atas jam 02.00.
4. Daily Closing Report: Merekapitulasi total omset harian, mematikan seluruh lampu & AC, serta mengunci venue dengan aman.`
        },
        {
            name: 'WULAN',
            position: 'Head Cashier & Player Onboarding Specialist',
            phone: '6281200000005',
            pinCode: '5555',
            shiftId: shiftMalamPeak.id,
            salary: 1200000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) WULAN:
1. Terima Shift Pukul 19.00: Menghitung uang kas awal dan menerima serah terima dari Anto.
2. Billing Kasir Malam: Membuka sesi meja biliar, memilih Paket 2 Jam Rp 50.000, dan mencatat pembayaran dengan akurasi 100%.
3. Duta Edukasi Player App: Wajib memandu pengunjung untuk instal & registrasi aplikasi Vamos Player App (menjelaskan keuntungan XP poin, handicap, dan voucher diskon).
4. Handover Pukul 02.00: Menyerahkan rekap kasir harian kepada Wawan jika masih ada pemain aktif.`
        },
        {
            name: 'NITA',
            position: 'Billiard Casteling & FnB Ambassador',
            phone: '6281200000003',
            pinCode: '3333',
            shiftId: shiftMalamPeak.id,
            salary: 1200000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) NITA:
1. Opening Meja Pukul 19.00: Membuka kain cover meja biliar, menyikat laken dari debu kapur, menyiapkan chalk, dan cek ujung stick.
2. Penawaran Menu di Meja (FnB Ambassador):
   - Menawarkan minuman dingin/kopi signature kepada pemain saat jeda frame.
   - Input pesanan via Vamos Staff App untuk klaim komisi FnB.
   - Mengajak rekan/pemain main di jam 19.00 - 21.00 untuk klaim Bonus Golden Hour.
3. Racking Presisi: Menyusun bola biliar (8-Ball, 9-Ball, 10-Ball) dengan cepat, rapat, dan presisi di titik spot.
4. Aturan Penutupan Cover Meja:
   - Jika jam 02.00 pemain sudah selesai: Pasang kembali kain cover meja biliar.
   - PENTING: Jika di atas jam 02.00 masih ada pemain aktif, meja tetap terbuka dan dilayani hingga tuntas!`
        },
        {
            name: 'SELVIE',
            position: 'Billiard Casteling & FnB Ambassador',
            phone: '6281200000004',
            pinCode: '4444',
            shiftId: shiftMalamPeak.id,
            salary: 1200000,
            jobdesk: `📋 STANDAR OPERASIONAL PROSEDUR (SOP) SELVIE:
1. Opening Meja Pukul 19.00: Membuka kain cover meja biliar, menyikat kain laken, menyiapkan kapur/chalk dan stick biliar.
2. Penawaran Menu di Meja (FnB Ambassador):
   - Proaktif menawarkan minuman dingin & snack kepada pemain biliar.
   - Menginput pesanan via Vamos Staff App untuk klaim komisi harian.
   - Mengajak pemain main di jam 19.00 - 21.00 untuk klaim Bonus Golden Hour.
3. Racking Presisi: Menyusun bola biliar secara cepat dan rapi setiap pergantian frame.
4. Aturan Penutupan Cover Meja:
   - Jika jam 02.00 meja sudah kosong: Bersihkan meja, rapikan bola ke rak, dan pasang cover meja.
   - PENTING: Jika masih ada pemain di atas jam 02.00, meja tetap terbuka dan dilayani dengan ramah.`
        }
    ];

    for (const staff of staffList) {
        const emp = await prisma.employee.upsert({
            where: { phone: staff.phone },
            update: {
                name: staff.name,
                position: staff.position,
                pinCode: staff.pinCode,
                salary: staff.salary,
                jobdesk: staff.jobdesk,
                shiftId: staff.shiftId,
                status: 'ACTIVE',
                approvalStatus: 'APPROVED'
            },
            create: {
                name: staff.name,
                position: staff.position,
                phone: staff.phone,
                pinCode: staff.pinCode,
                salary: staff.salary,
                jobdesk: staff.jobdesk,
                shiftId: staff.shiftId,
                status: 'ACTIVE',
                approvalStatus: 'APPROVED'
            }
        });
        console.log(`✅ Staf Aktif: ${emp.name} (${emp.position}) - Phone: ${emp.phone} | PIN: ${emp.pinCode}`);
    }

    console.log('🎉 Seluruh 7 Staf Resmi & SOP Standar Vamos berhasil diperbarui!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
