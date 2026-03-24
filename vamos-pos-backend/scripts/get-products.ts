import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.findMany();
    console.log(JSON.stringify(products, null, 2));
}
main().finally(() => prisma.$disconnect());
