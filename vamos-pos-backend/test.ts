import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.tournament.findMany().then(t => { console.log(t); prisma.$disconnect(); });
