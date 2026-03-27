import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllSyncStatus() {
    const tables = ['CashierShift', 'Member', 'Session', 'Order', 'Payment', 'Expense', 'Waitlist'];
    for (const t of tables) {
        try {
            const result = await prisma.$queryRawUnsafe(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${t}';
            `);
            const names = (result as any[]).map(c => c.column_name);
            console.log(`Table ${t}: ${names.includes('syncStatus') ? 'HAS IT' : 'MISSING IT'}`);
        } catch (e: any) {
            console.error(`Error checking ${t}: ${e.message}`);
        }
    }
    process.exit(0);
}
checkAllSyncStatus();
