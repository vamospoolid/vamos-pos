import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const calculateLevel = (xp: number) => {
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
};

const membersToRestore = [
  { name: 'ZAHRA', phone: '082358363050', experience: 1130, totalWins: 9 },
  { name: 'HASRAL', phone: '085241748185', experience: 388, totalWins: 1 },
  { name: 'AHMAD ASTO', phone: '085395992985', experience: 338, totalWins: 0 },
  { name: 'ARIF VAMOS', phone: '085298958995', experience: 295, totalWins: 7 },
  { name: 'intan casteling', phone: '089651511', experience: 272, totalWins: 0 },
  { name: 'RAHMAT', phone: '082393057890', experience: 254, totalWins: 3 },
  { name: '98', phone: '085242424854', experience: 230, totalWins: 2 },
  { name: 'TAHIR', phone: '082396675032', experience: 214, totalWins: 0 },
  { name: 'WAWAN2', phone: '082297828227', experience: 200, totalWins: 1 },
  { name: 'MUHSAAPR', phone: '083873172195', experience: 182, totalWins: 0 },
  { name: 'SYAFI', phone: '082256462226', experience: 171, totalWins: 1 },
  { name: 'RAFLY', phone: '081283028365', experience: 148, totalWins: 4 },
  { name: 'CING', phone: '085235555451', experience: 143, totalWins: 1 },
  { name: 'TAUFIK', phone: '082211995648', experience: 140, totalWins: 1 },
  { name: 'RAFA 1', phone: '0650090', experience: 137, totalWins: 0 },
  { name: 'WAWAN VAMOS', phone: '081245412181', experience: 130, totalWins: 12 },
  { name: 'GALEMPONG', phone: '081343798688', experience: 90, totalWins: 2 },
  { name: 'nita casteling', phone: '08965151', experience: 88, totalWins: 0 },
  { name: 'LEXUS', phone: '085243748384', experience: 75, totalWins: 3 },
  { name: 'JYTIUL', phone: '08520000000', experience: 50, totalWins: 0 },
];

async function main() {
  console.log('⏳ Mulai memasukkan data dari screenshot ke database lokal...');

  for (const member of membersToRestore) {
    const level = calculateLevel(member.experience);
    try {
      await prisma.member.upsert({
        where: { phone: member.phone },
        update: {
          loyaltyPoints: member.experience,
          experience: member.experience,
          totalWins: member.totalWins,
          level: level,
        },
        create: {
          name: member.name,
          phone: member.phone,
          loyaltyPoints: member.experience,
          experience: member.experience,
          totalWins: member.totalWins,
          level: level,
          tier: 'BRONZE',
          identityStatus: 'VERIFIED',
          isWaVerified: true
        }
      });
      console.log(`✅ Berhasil: ${member.name} (Poin: ${member.experience}, Wins: ${member.totalWins})`);
    } catch (error: any) {
      console.error(`❌ Gagal: ${member.name} -`, error.message);
    }
  }

  console.log('🎉 Selesai! Semua member dari screenshot sudah dimasukkan ke database lokal.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
