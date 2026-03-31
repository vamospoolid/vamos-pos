import { PrismaClient, Role, TableStatus } from '@prisma/client';
import process from 'process';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with user defaults...');

  // 1. CLEAR EXISTING DATA (Optional, but ensures fresh start)
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.package.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.product.deleteMany();
  await prisma.table.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // 2. CREATE VENUE (Settings based on Screenshots & Request)
  const venue = await prisma.venue.create({
    data: {
      name: 'VAMOS POOL',
      address: 'VAMOS POOL & BILLIARD',
      openTime: '10:00', // As per Report screenshot
      closeTime: '04:00', // Operational night
      relayComPort: 'COM3',
      printerPath: 'USB001',
      taxPercent: 11,
      servicePercent: 5,
    }
  });

  // 3. CREATE ADMIN
  await prisma.user.create({
    data: {
      email: 'admin@vamos.id',
      password: 'password_here', // User should change this later
      name: 'Admin Vamos',
      role: Role.ADMIN,
    }
  });

  // 4. CREATE TABLES (Default 10 tables)
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        name: `Table ${i}`,
        type: 'REGULAR',
        status: TableStatus.AVAILABLE,
        relayChannel: i,
        venueId: venue.id,
      }
    });
  }

  // 5. PRICING RULES (Strategic)
  await prisma.pricingRule.createMany({
    data: [
      {
        name: 'SIANG',
        tableType: 'REGULAR',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '09:00',
        endTime: '17:59',
        ratePerHour: 25000,
        memberRatePerHour: 20000,
      },
      {
        name: 'MALAM',
        tableType: 'REGULAR',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '18:00',
        endTime: '08:59',
        ratePerHour: 35000,
        memberRatePerHour: 30000,
      },
    ]
  });

  // 6. PACKAGES
  await prisma.package.createMany({
    data: [
      {
        name: 'NORMAL SIANG',
        tableType: 'REGULAR',
        duration: 60,
        price: 25000,
        memberPrice: 20000,
        startTime: '09:00',
        endTime: '17:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'SIANG 2 JAM',
        tableType: 'REGULAR',
        duration: 120,
        price: 40000,
        memberPrice: 35000,
        startTime: '09:00',
        endTime: '17:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'SIANG 3 JAM',
        tableType: 'REGULAR',
        duration: 180,
        price: 50000,
        memberPrice: 45000,
        startTime: '09:00',
        endTime: '17:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'PAKET 2 JAM MALAM',
        tableType: 'REGULAR',
        duration: 120,
        price: 50000,
        memberPrice: 45000,
        startTime: '18:00',
        endTime: '08:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'PAKET 3 JAM MALAM',
        tableType: 'REGULAR',
        duration: 180,
        price: 75000,
        memberPrice: 70000,
        startTime: '18:00',
        endTime: '08:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
    ]
  });

  // 7. F&B PRODUCTS (Menu based on screenshot)
  await prisma.product.createMany({
    data: [
      { name: 'AIR MINERAL', price: 5000, stock: 50, category: 'Beverage (Minuman)' },
      { name: 'COKLAT', price: 18000, stock: 100, category: 'Beverage (Minuman)' },
      { name: 'ES KOPI SUSU', price: 15000, stock: 150, category: 'Beverage (Minuman)' },
      { name: 'GREENTEA', price: 15000, stock: 100, category: 'Beverage (Minuman)' },
      { name: 'KERIPIK PISANG', price: 5000, stock: 20, category: 'Food (Makanan)' },
      { name: 'KOPI BUTTERSCOT', price: 18000, stock: 120, category: 'Beverage (Minuman)' },
      { name: 'KOPI CARAMEL', price: 18000, stock: 110, category: 'Beverage (Minuman)' },
      { name: 'KOPI GULA AREN', price: 16000, stock: 130, category: 'Beverage (Minuman)' },
      { name: 'KOPI PANDAN', price: 18000, stock: 115, category: 'Beverage (Minuman)' },
      { name: 'KOPI REGAL', price: 18000, stock: 110, category: 'Beverage (Minuman)' },
      { name: 'THAITEA', price: 15000, stock: 120, category: 'Beverage (Minuman)' },
    ]
  });

  console.log('✅ Default data successfully planted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
