const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Memperbarui Jobdesk Casteling sebagai Duta Penawaran Menu...');

    const jobdeskCastelingNita = `📌 STANDAR OPERASIONAL PROSEDUR (SOP) & JOBDESK:
1. Penawaran Menu & FnB Ambassador (Prioritas):
   - Aktif menawarkan minuman segar / kopi barista saat pemain baru tiba di meja.
   - Menawarkan snack / makanan saat jeda antar frame/game.
   - Menginput pesanan langsung dari HP via Vamos Staff App (Bonus komisi penjualan FnB masuk otomatis ke akun Anda).
2. Pengaturan Bola Presisi (Racking):
   - Menyusun bola (8-Ball, 9-Ball, 10-Ball) secara cepat, rapat, dan presisi pada titik spot.
3. Pemeliharaan Meja & Alat:
   - Memastikan kapur/chalk selalu tersedia dan menyikat kain laken meja dari debu kapur.
4. Hospitality & Player Care:
   - Melayani pemain dengan ramah, sigap membantu stick cagak (rest cue), dan menjaga suasana meja tetap asyik.`;

    const jobdeskCastelingSelvie = `📌 STANDAR OPERASIONAL PROSEDUR (SOP) & JOBDESK:
1. Penawaran Menu & FnB Ambassador (Prioritas):
   - Menawarkan menu minuman dingin, kopi racikan Wawan, atau snack favorit saat mendampingi pemain.
   - Membantu pemain melakukan re-order minuman tanpa pemain harus memanggil kasir.
   - Menginput pesanan via Vamos Staff App untuk menambah perolehan bonus up-selling harian.
2. Pengaturan Bola Presisi (Racking):
   - Menyusun bola biliar dengan rapi, cepat, dan presisi di setiap pergantian frame.
3. Kebersihan Meja Permainan:
   - Membersihkan meja dan bola biliar setelah sesi selesai sebelum tamu berikutnya masuk.
4. Hospitality & Service Excellence:
   - Ramah, komunikatif, dan responsif terhadap kebutuhan pemain selama bermain.`;

    // Update Nita
    await prisma.employee.updateMany({
        where: { phone: '6281200000003' },
        data: {
            position: 'Billiard Casteling & FnB Ambassador',
            jobdesk: jobdeskCastelingNita
        }
    });

    // Update Selvie
    await prisma.employee.updateMany({
        where: { phone: '6281200000004' },
        data: {
            position: 'Billiard Casteling & FnB Ambassador',
            jobdesk: jobdeskCastelingSelvie
        }
    });

    console.log('✅ Jobdesk NITA & SELVIE berhasil diperbarui dengan fokus Penawaran Menu & Up-Selling Meja!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
