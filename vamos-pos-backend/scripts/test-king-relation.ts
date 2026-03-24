import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const kingTables = await prisma.kingTable.findMany();
    console.log('KingTable count:', kingTables.length);
    
    const tables = await prisma.table.findMany({
        include: { kingStatus: true }
    });
    console.log('Tables with kingStatus fetched successfully');
  } catch (error) {
    console.error('Prisma query error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
