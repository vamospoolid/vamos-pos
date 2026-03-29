const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');

function getHardwareId() {
    try {
        if (process.platform === 'win32') {
            const output = execSync('wmic csproduct get uuid').toString();
            const lines = output.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && trimmed.toUpperCase() !== 'UUID' && trimmed.length > 5) return trimmed;
            }
        }
        return `FALLBACK-${process.platform}-${process.env.COMPUTERNAME || 'NODE'}`;
    } catch (e) {
        return 'UNKNOWN-MACHINE';
    }
}

async function fixEverything() {
    console.log('--- SYSTEM REPAIR VAMOS V2 ---');
    const hwid = getHardwareId();
    console.log('1. Activating Machine ID:', hwid);
    
    await prisma.license.upsert({
        where: { hardwareId: hwid },
        update: {
            licenseKey: 'MASTER-' + hwid,
            isActivated: true,
            isActive: true,
            activatedAt: new Date(),
        },
        create: {
            licenseKey: 'MASTER-' + hwid,
            hardwareId: hwid,
            isActivated: true,
            isActive: true,
            activatedAt: new Date(),
        }
    });
    console.log('   ✅ License successfully activated.');

    const venue = await prisma.venue.findFirst();
    if (venue) {
        await prisma.venue.update({
            where: { id: venue.id },
            data: {
                relayComPort: 'COM3',
                blinkWarningMinutes: 5,
                isSyncEnabled: true,
                syncIntervalSeconds: 30
            }
        });
        console.log('2. Resetting Hardware Port to COM3 in DB.');
    }
    
    console.log('\n✅ REPAIR COMPLETE. Please start `npm run dev` in a NEW terminal.');
    await prisma.$disconnect();
}

fixEverything().catch(e => {
    console.error('❌ Error during repair:', e.message);
    process.exit(1);
});
