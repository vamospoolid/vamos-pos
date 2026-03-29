const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log('--- DIAGNOSTIC VAMOS POS ---');
    console.log('1. Checking Database Connection...');
    try {
        const venue = await prisma.venue.findFirst();
        if (!venue) {
            console.log('   Creating default venue data...');
            await prisma.venue.create({
                data: {
                    name: 'VAMOS POOL & CAFE SERPONG',
                    relayComPort: 'COM3',
                    blinkWarningMinutes: 5,
                    isSyncEnabled: true,
                    syncIntervalSeconds: 30
                }
            });
            console.log('   ✅ Default venue created.');
        } else {
            console.log('   Updating venue settings to user requests...');
            await prisma.venue.update({
                where: { id: venue.id },
                data: {
                    relayComPort: 'COM3',
                    blinkWarningMinutes: 5,
                    isSyncEnabled: true,
                    syncIntervalSeconds: 30
                }
            });
            console.log('   ✅ Venue settings updated: COM3, 5 min blink, Auto-Sync ON.');
        }

        const updated = await prisma.venue.findFirst();
        console.log('\n2. Verifying New Settings:');
        console.log('   - Relay Port  :', updated.relayComPort);
        console.log('   - Blink Warn  :', updated.blinkWarningMinutes, 'minutes');
        console.log('   - Sync Enabled:', updated.isSyncEnabled);
        console.log('   - Sync Speed  :', updated.syncIntervalSeconds, 'seconds');
        
        console.log('\n✅ ALL SETTINGS READY FOR OPERATION.');
        console.log('Running `npm run dev` in the backend will now use these settings.');
    } catch (e) {
        console.error('❌ Error during diagnostics:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
