const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Memeriksa / Membuat default admin di database lokal...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@vamos.pos' },
    update: {
      password: hashedPassword,
      name: 'Admin Lokal',
      role: 'ADMIN'
    },
    create: {
      email: 'admin@vamos.pos',
      name: 'Admin Lokal',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Akun Admin Lokal Siap Digunakan!');
  console.log('Email   : admin@vamos.pos');
  console.log('Password: admin123');
  console.log('Role    : ADMIN');
  console.log('--------------------------------------------------');

  const allUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  console.log('Semua user yang ada di database lokal:');
  allUsers.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
