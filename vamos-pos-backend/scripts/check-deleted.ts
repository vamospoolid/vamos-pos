import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const allTables = await prisma.table.findMany();
    console.log('Total tables in DB:', allTables.length);
    console.log('Tables with deletedAt:', allTables.filter(t => t.deletedAt !== null).length);
    console.log('Tables with deletedAt is null:', allTables.filter(t => t.deletedAt === null).length);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
