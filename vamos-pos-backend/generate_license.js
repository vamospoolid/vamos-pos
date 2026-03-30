/**
 * LICENSE GENERATOR for Vamos POS
 * Jalankan file ini di server untuk mencetak License Key baru bagi klien.
 * Penggunaan: node generate_license.js [NamaKlien]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function generate(clientName = 'CLIENT') {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const licenseKey = `VAMOS-${clientName.toUpperCase()}-${randomHex}`;

    try {
        const license = await prisma.license.create({
            data: {
                licenseKey: licenseKey,
                isActivated: false, // Menunggu aktivasi dari laptop kasir
                isActive: true
            }
        });

        console.log('\n=============================================');
        console.log('✅ LICENSE KEY BERHASIL DICETAK');
        console.log('=============================================');
        console.log(`Klien       : ${clientName}`);
        console.log(`License Key : ${license.licenseKey}`);
        console.log('---------------------------------------------');
        console.log('Instruksi:');
        console.log('1. Berikan License Key di atas ke kasir.');
        console.log('2. Kasir memasukkan Key tersebut di menu Admin > Lisensi.');
        console.log('3. Sistem akan otomatis mengunci ke Hardware ID laptop tsb.');
        console.log('=============================================\n');
    } catch (error) {
        console.error('❌ GAGAL MENCETAK LISENSI:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

const args = process.argv.slice(2);
generate(args[0]);
