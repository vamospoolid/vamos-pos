const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pkgs = await prisma.package.findMany({ where: { deletedAt: null } });
    console.log('--- PACKAGES ---');
    console.log(JSON.stringify(pkgs, null, 2));

    const rules = await prisma.pricingRule.findMany({ where: { deletedAt: null } });
    console.log('--- PRICING RULES ---');
    console.log(JSON.stringify(rules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
