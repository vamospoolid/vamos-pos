const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany();
    console.log('PRODUCTS:');
    products.forEach(p => console.log(JSON.stringify(p)));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
