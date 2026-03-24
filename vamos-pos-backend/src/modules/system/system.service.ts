import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// ─── DEFAULT SEED DATA ───────────────────────────────────────────────────────
// Pricing rules & packages yang akan di-seed setelah reset
// Berlaku untuk semua tabel type 'REGULAR'
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PRICING_RULES = [
    // Siang: 09:00 – 17:00 | Rp 25.000/jam | Semua hari (0–6)
    {
        name: 'Siang Regular',
        tableType: 'REGULAR',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '09:00',
        endTime: '17:00',
        ratePerHour: 25000,
        memberRatePerHour: 22000,
        isActive: true,
    },
    // Sore/Malam: 17:00 – 02:00 | Rp 35.000/jam | Semua hari
    {
        name: 'Malam Regular',
        tableType: 'REGULAR',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '17:00',
        endTime: '02:00',
        ratePerHour: 35000,
        memberRatePerHour: 30000,
        isActive: true,
    },
    // Dini Hari: 02:00 – 07:00 | Rp 30.000/jam | Semua hari
    {
        name: 'Dini Hari Regular',
        tableType: 'REGULAR',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '02:00',
        endTime: '07:00',
        ratePerHour: 30000,
        memberRatePerHour: 27000,
        isActive: true,
    },
];

const DEFAULT_PACKAGES = [
    // Paket Siang 2 jam Rp 40.000 — Senin–Jumat + Sabtu siang (bukan malam minggu)
    // dayOfWeek: [1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu]
    {
        name: 'Paket Siang 2 Jam',
        tableType: 'REGULAR',
        duration: 120,       // menit
        price: 40000,
        memberPrice: 35000,
        isActive: true,
        dayOfWeek: [1, 2, 3, 4, 5, 6],   // Senin–Sabtu (tidak termasuk Minggu malam)
        startTime: '09:00',
        endTime: '17:00',
        fnbItems: null,
    },
    // Paket Malam 2 jam Rp 50.000 — Senin–Sabtu (bukan malam minggu = Sabtu malam)
    {
        name: 'Paket Malam 2 Jam',
        tableType: 'REGULAR',
        duration: 120,
        price: 50000,
        memberPrice: 45000,
        isActive: true,
        dayOfWeek: [1, 2, 3, 4, 5],     // Senin–Jumat saja (exclude Sabtu malam/malam minggu)
        startTime: '17:00',
        endTime: '02:00',
        fnbItems: null,
    },
];

// ─────────────────────────────────────────────────────────────────────────────

export class SystemService {

    /**
     * Export all data from database as JSON (backup)
     */
    static async exportDatabase() {
        const data: any = {};
        const models = [
            'venue', 'table', 'user', 'pricingRule', 'package',
            'member', 'session', 'product', 'order', 'payment',
            'match', 'matchMember', 'auditLog', 'tournament',
            'tournamentParticipant', 'tournamentMatch', 'expense',
            'employee', 'attendance', 'reward', 'redemption',
            'pointLog', 'loyaltyConfig', 'waitlist', 'cashierShift',
            'matchChallenge', 'discountCategory', 'announcement',
        ];
        for (const model of models) {
            try {
                data[model] = await (prisma as any)[model].findMany();
            } catch (_) {
                data[model] = [];
            }
        }
        return data;
    }

    /**
     * Seed default pricing rules & packages.
     * Clears existing pricing/packages first, then inserts defaults.
     */
    static async seedDefaults() {
        await prisma.$transaction(async (tx) => {
            // Hapus semua pricing & package yang ada
            await tx.pricingRule.deleteMany();
            await tx.package.deleteMany();

            // Insert default pricing rules
            for (const rule of DEFAULT_PRICING_RULES) {
                await tx.pricingRule.create({ data: rule });
            }

            // Insert default packages
            for (const pkg of DEFAULT_PACKAGES) {
                await tx.package.create({ data: pkg });
            }
        });

        return {
            success: true,
            pricingRules: DEFAULT_PRICING_RULES.length,
            packages: DEFAULT_PACKAGES.length,
            message: `Seeded ${DEFAULT_PRICING_RULES.length} pricing rules dan ${DEFAULT_PACKAGES.length} packages default.`,
        };
    }

    /**
     * Reset operational data (sessions, payments, members, etc.)
     * Kemudian seed ulang pricing & packages default.
     * Data master (Table, Venue, User, Product, dll) TIDAK dihapus.
     */
    static async resetData() {
        const tables = await prisma.table.findMany({ where: { deletedAt: null } });

        await prisma.$transaction(async (tx) => {
            // Hapus data operasional (urutan penting untuk foreign key)
            await tx.matchChallenge.deleteMany();
            await tx.pointLog.deleteMany();
            await tx.redemption.deleteMany();
            await tx.matchMember.deleteMany();
            await tx.match.deleteMany();
            await tx.payment.deleteMany();
            await tx.cashierShift.deleteMany();
            await tx.order.deleteMany();
            await tx.tournamentMatch.deleteMany();
            await tx.tournamentParticipant.deleteMany();
            await tx.tournament.deleteMany();
            await tx.attendance.deleteMany();
            await tx.waitlist.deleteMany();
            await tx.session.deleteMany();
            await tx.member.deleteMany();
            await tx.expense.deleteMany();
            await tx.auditLog.deleteMany();

            // Reset semua meja ke AVAILABLE
            await tx.table.updateMany({ data: { status: 'AVAILABLE' } });
        });

        // Matikan semua relay (lazy import hindari circular dependency)
        const { RelayService } = await import('../relay/relay.service');
        for (const table of tables) {
            try {
                await RelayService.sendCommand(table.relayChannel, 'off');
            } catch (_) { /* relay mungkin tidak tersambung, abaikan */ }
        }

        // Seed ulang pricing & packages default
        const seedResult = await SystemService.seedDefaults();

        return {
            success: true,
            message: 'Reset selesai. Data operasional dihapus, meja di-reset ke AVAILABLE.',
            details: {
                tablesReset: tables.length,
                ...seedResult,
            },
        };
    }

    /**
     * Fix tables that are stuck in PLAYING but have no active session.
     * Delegates ke TableService.fixStuckTables() agar logika relay OFF terpusat.
     */
    static async fixStuckTables() {
        const { TableService } = await import('../tables/table.service');
        const result = await TableService.fixStuckTables();

        return {
            success: true,
            message: result.fixed > 0
                ? `${result.fixed} meja stuck berhasil diperbaiki & lampu dimatikan: [${result.tableNames.join(', ')}]`
                : 'Tidak ada meja yang stuck.',
            details: {
                fixed: result.fixed,
                tableNames: result.tableNames,
                relayOff: result.relayOff,
                relayErrors: result.relayErrors,
            },
        };
    }
}

