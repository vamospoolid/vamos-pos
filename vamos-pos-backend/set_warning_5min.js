const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const venue = await p.venue.findFirst();
    if (!venue) {
        console.log('⚠️ Belum ada data Venue. Membuat data default...');
        await p.venue.create({
            data: {
                name: 'VAMOS Pool Center',
                blinkWarningMinutes: 5,
                relayComPort: 'COM4'
            }
        });
    } else {
        await p.venue.updateMany({
            data: {
                blinkWarningMinutes: 5,
                relayComPort: 'COM4'
            }
        });
    }
    console.log('✅ DATABASE UPDATED: Peringatan 5 Menit & Port COM4 telah DIKUNCI.');
}

main().catch(console.error).finally(() => p.$disconnect());
