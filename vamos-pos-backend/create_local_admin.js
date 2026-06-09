const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:admin@localhost:5432/vamos_pos?schema=public"
    }
  }
});

async function main() {
  console.log('⏳ Membuat default admin di database lokal...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@vamos.pos' },
    update: {
      password: hashedPassword,
      name: 'Admin Lokal'
    },
    create: {
      email: 'admin@vamos.pos',
      name: 'Admin Lokal',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin Lokal Berhasil Disiapkan!');
  console.log(`Email   : ${user.email}`);
  console.log('Password: admin123');
  console.log('--------------------------------------------------');
  console.log('Aman digunakan secara offline tanpa mengotori data transaksi VPS.');
}

main()
  .catch((e) => {
    console.error('❌ Gagal membuat user lokal:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
