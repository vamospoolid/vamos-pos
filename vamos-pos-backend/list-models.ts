import { prisma } from './src/database/db';

console.log('Available models in prisma:');
Object.keys(prisma).filter(k => !k.startsWith('_')).forEach(k => console.log(k));
