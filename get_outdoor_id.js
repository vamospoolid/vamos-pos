const { PrismaClient } = require('./vamos-pos-backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.table.findFirst({where: {name: 'OUTDOOR 1'}}).then(t => console.log(t?.id)).finally(() => prisma.$disconnect());
