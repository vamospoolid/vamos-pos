import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkColumns() {
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Session';
        `;
        console.log("Columns in Session table:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}
checkColumns();
