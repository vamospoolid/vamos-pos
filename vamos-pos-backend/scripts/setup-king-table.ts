import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.table.findMany();
  console.log('Tables:', tables.map(t => ({ id: t.id, name: t.name, isKing: (t as any).isKingTable })));

  if (tables.length > 0) {
    const target = tables.find(t => t.name.includes('01')) || tables[0];
    console.log(`Designating ${target.name} as King Table...`);
    await prisma.table.update({
        where: { id: target.id },
        data: { isKingTable: true } as any
    });
    console.log('Done!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
