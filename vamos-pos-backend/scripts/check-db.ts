import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const venues = await prisma.venue.findMany();
    const tables = await prisma.table.findMany();
    console.log('Venues found:', venues.length);
    console.log('Tables found:', tables.length);
    if (venues.length > 0) {
        console.log('First venue:', venues[0].name);
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
