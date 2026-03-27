import { prisma } from './src/database/db';

async function checkSyncStatus() {
    try {
        const counts = await Promise.all([
            prisma.cashierShift.count({ where: { syncStatus: 'PENDING' } }),
            prisma.member.count({ where: { syncStatus: 'PENDING' } }),
            prisma.session.count({ where: { syncStatus: 'PENDING' } }),
            prisma.order.count({ where: { syncStatus: 'PENDING' } }),
            prisma.payment.count({ where: { syncStatus: 'PENDING' } }),
            prisma.expense.count({ where: { syncStatus: 'PENDING' } }),
            prisma.waitlist.count({ where: { syncStatus: 'PENDING' } })
        ]);
        const total = counts.reduce((a, b) => a + b, 0);
        console.log(`Total Pending: ${total}`);
        console.log(`Counts: ${JSON.stringify(counts)}`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkSyncStatus();
