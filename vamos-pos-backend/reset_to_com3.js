const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    await p.venue.updateMany({
        data: {
            relayComPort: "COM3", // Set default ke Kasir
            blinkWarningMinutes: 5 // Kunci peringatan 5 menit
        }
    });
    console.log('✅ KONFIGURASI PROD: Default port diset ke COM3. Sistem tetap fleksibel melakukan auto-scan jika hardware dipindah.');
}

main().catch(console.error).finally(() => p.$disconnect());
