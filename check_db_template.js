const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplate() {
    const tpl = await prisma.waTemplate.findUnique({ where: { id: 'wa_booking_confirm' } });
    console.log(JSON.stringify(tpl, null, 2));
    await prisma.$disconnect();
}

checkTemplate().catch(console.error);
