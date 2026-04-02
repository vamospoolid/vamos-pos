const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pricingRules = [
    { id: "40b09f05-358a-492e-ace1-6604923de4ed", name: "Malam Regular", tableType: "REGULAR", dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "17:00", endTime: "02:00", ratePerHour: 35000, memberRatePerHour: 35000, isActive: true },
    { id: "e789f514-7db8-41f3-92a1-84bc3ae2ef00", name: "Siang Regular", tableType: "REGULAR", dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "17:00", ratePerHour: 25000, memberRatePerHour: 25000, isActive: true },
    { id: "575eba02-64d8-4dba-9340-9fb5e4e13733", name: "Dini Hari Regular", tableType: "REGULAR", dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "02:00", endTime: "07:00", ratePerHour: 30000, memberRatePerHour: 30000, isActive: true },
    { id: "f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c", name: "Exhibition", tableType: "EXEBITION", dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "00:00", endTime: "23:59", ratePerHour: 30000, memberRatePerHour: 30000, isActive: true }
];

async function main() {
    console.log("🕒 Memulai sinkronisasi Pricing Hourly Rate ke Database (VPS)...");
    
    // Hapus data tarif lama agar bersih
    console.log("🗑️ Menghapus tarif (hourly rate) lama...");
    await prisma.pricingRule.deleteMany();

    // Masukkan data baru yang sama persis dengan lokal
    console.log("📝 Menyalin tarif hourly rate baru...");
    await prisma.pricingRule.createMany({ data: pricingRules });

    console.log("✅ Berhasil! Tarif (Hourly Rate Pricing) di VPS sekarang sama persis dengan Kasir Lokal.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
