const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    await p.venue.updateMany({
        data: {
            relayComPort: null // Kosongkan agar sinkronisasi VPS-Lokal fleksibel mencari port
        }
    });
    console.log('✅ SINKRONISASI AKTIF: Port hardcode dihapus. Sistem akan Auto-Scan COM3/COM4 secara fleksibel.');
}

main().catch(console.error).finally(() => p.$disconnect());
