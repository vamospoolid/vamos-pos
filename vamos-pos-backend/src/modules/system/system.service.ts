import { prisma } from '../../database/db';


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
            // ── Master / Config ──────────────────────────────────────────────
            'venue', 'table', 'user', 'pricingRule', 'package',
            'loyaltyConfig', 'discountCategory', 'announcement',
            'waTemplate', 'employee',

            // ── Members & Loyalty ────────────────────────────────────────────
            'member', 'reward', 'redemption', 'pointLog',
            'rankHistory', 'quest', 'memberQuest',

            // ── Products & Inventory ─────────────────────────────────────────
            'product', 'stockHistory',

            // ── Operations ───────────────────────────────────────────────────
            'session', 'order', 'payment', 'expense',
            'cashierShift', 'waitlist', 'kingTable',

            // ── Matches & Tournaments ────────────────────────────────────────
            'match', 'matchMember', 'matchChallenge',
            'tournament', 'tournamentParticipant', 'tournamentMatch',

            // ── Attendance & Audit ───────────────────────────────────────────
            'attendance', 'auditLog',
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
            // Hapus data operasional (urutan penting untuk foreign key - Bottom Up)
            await tx.matchMember.deleteMany();
            await tx.match.deleteMany();
            await tx.matchChallenge.deleteMany();
            await tx.pointLog.deleteMany();
            await tx.redemption.deleteMany();
            await tx.order.deleteMany();
            await tx.stockHistory.deleteMany();
            await tx.payment.deleteMany();
            await tx.expense.deleteMany();
            await tx.cashierShift.deleteMany();
            await tx.tournamentMatch.deleteMany();
            await tx.tournamentParticipant.deleteMany();
            await tx.tournament.deleteMany();
            await tx.attendance.deleteMany();
            await tx.waitlist.deleteMany();
            await tx.kingTable.deleteMany();
            await tx.rankHistory.deleteMany();
            await tx.session.deleteMany();
            await tx.member.deleteMany();
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

    /**
     * Import database from JSON backup data
     */
    static async importDatabase(data: any) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data backup JSON tidak valid.');
        }

        // Helper to convert ISO date strings back to Date objects for Prisma
        const parseDates = (items: any[]) => {
            if (!items) return [];
            return items.map(item => {
                const newItem = { ...item };
                for (const key in newItem) {
                    if (typeof newItem[key] === 'string') {
                        // Pattern matching ISO date string format
                        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(newItem[key])) {
                            newItem[key] = new Date(newItem[key]);
                        }
                    }
                }
                return newItem;
            });
        };

        // Hapus data secara transaksional
        await prisma.$transaction(async (tx) => {
            // Urutan delete bottom-up untuk menghindari foreign key violation
            const deleteOrder = [
                // Bottom-up (children first to satisfy FK constraints)
                'memberQuest', 'matchMember', 'matchChallenge', 'pointLog', 'redemption',
                'order', 'stockHistory', 'payment', 'expense', 'cashierShift',
                'tournamentMatch', 'tournamentParticipant', 'tournament',
                'attendance', 'waitlist', 'kingTable', 'rankHistory', 'reward',
                'match', 'session', 'member', 'auditLog',
                'pricingRule', 'package', 'product', 'table', 'user', 'employee',
                'discountCategory', 'announcement', 'waTemplate', 'loyaltyConfig',
                'quest', 'venue',
            ];

            for (const model of deleteOrder) {
                if ((tx as any)[model]) {
                    await (tx as any)[model].deleteMany();
                }
            }

            // Urutan insert top-down
            // 1. Venue
            if (data.venue && data.venue.length > 0) {
                await tx.venue.createMany({ data: parseDates(data.venue) });
            }
            // 2. LoyaltyConfig
            if (data.loyaltyConfig && data.loyaltyConfig.length > 0) {
                await tx.loyaltyConfig.createMany({ data: parseDates(data.loyaltyConfig) });
            }
            // 3. User, Employee, Config tables
            if (data.user && data.user.length > 0) {
                await tx.user.createMany({ data: parseDates(data.user) });
            }
            if (data.employee && data.employee.length > 0) {
                await tx.employee.createMany({ data: parseDates(data.employee) });
            }
            if (data.discountCategory && data.discountCategory.length > 0) {
                await tx.discountCategory.createMany({ data: parseDates(data.discountCategory) });
            }
            if (data.announcement && data.announcement.length > 0) {
                await tx.announcement.createMany({ data: parseDates(data.announcement) });
            }
            if (data.waTemplate && data.waTemplate.length > 0) {
                await tx.waTemplate.createMany({ data: parseDates(data.waTemplate) });
            }
            if (data.quest && data.quest.length > 0) {
                await tx.quest.createMany({ data: parseDates(data.quest) });
            }
            // 4. Table & Product & Member & Tournament & PricingRule & Package
            if (data.table && data.table.length > 0) {
                await tx.table.createMany({ data: parseDates(data.table) });
            }
            if (data.product && data.product.length > 0) {
                await tx.product.createMany({ data: parseDates(data.product) });
            }
            if (data.member && data.member.length > 0) {
                // Tandai sebagai SYNCED agar tidak dikirim ulang ke VPS
                const membersWithSync = data.member.map((m: any) => ({ ...m, syncStatus: 'SYNCED' }));
                await tx.member.createMany({ data: parseDates(membersWithSync) });
            }
            if (data.tournament && data.tournament.length > 0) {
                await tx.tournament.createMany({ data: parseDates(data.tournament) });
            }
            if (data.pricingRule && data.pricingRule.length > 0) {
                await tx.pricingRule.createMany({ data: parseDates(data.pricingRule) });
            }
            if (data.package && data.package.length > 0) {
                await tx.package.createMany({ data: parseDates(data.package) });
            }
            // 5. Session & CashierShift & Expense & Attendance & Reward
            if (data.session && data.session.length > 0) {
                await tx.session.createMany({ data: parseDates(data.session) });
            }
            if (data.cashierShift && data.cashierShift.length > 0) {
                await tx.cashierShift.createMany({ data: parseDates(data.cashierShift) });
            }
            if (data.expense && data.expense.length > 0) {
                await tx.expense.createMany({ data: parseDates(data.expense) });
            }
            if (data.attendance && data.attendance.length > 0) {
                await tx.attendance.createMany({ data: parseDates(data.attendance) });
            }
            if (data.reward && data.reward.length > 0) {
                await tx.reward.createMany({ data: parseDates(data.reward) });
            }
            if (data.kingTable && data.kingTable.length > 0) {
                await tx.kingTable.createMany({ data: parseDates(data.kingTable) });
            }
            if (data.rankHistory && data.rankHistory.length > 0) {
                await tx.rankHistory.createMany({ data: parseDates(data.rankHistory) });
            }
            if (data.stockHistory && data.stockHistory.length > 0) {
                await tx.stockHistory.createMany({ data: parseDates(data.stockHistory) });
            }
            // 6. Order & Payment & Waitlist & TournamentParticipant & TournamentMatch & Redemption & PointLog
            if (data.order && data.order.length > 0) {
                await tx.order.createMany({ data: parseDates(data.order) });
            }
            if (data.payment && data.payment.length > 0) {
                await tx.payment.createMany({ data: parseDates(data.payment) });
            }
            if (data.waitlist && data.waitlist.length > 0) {
                await tx.waitlist.createMany({ data: parseDates(data.waitlist) });
            }
            if (data.tournamentParticipant && data.tournamentParticipant.length > 0) {
                await tx.tournamentParticipant.createMany({ data: parseDates(data.tournamentParticipant) });
            }
            if (data.tournamentMatch && data.tournamentMatch.length > 0) {
                await tx.tournamentMatch.createMany({ data: parseDates(data.tournamentMatch) });
            }
            if (data.redemption && data.redemption.length > 0) {
                await tx.redemption.createMany({ data: parseDates(data.redemption) });
            }
            if (data.pointLog && data.pointLog.length > 0) {
                await tx.pointLog.createMany({ data: parseDates(data.pointLog) });
            }
            // 7. Match & MatchMember & MatchChallenge & AuditLog
            if (data.match && data.match.length > 0) {
                await tx.match.createMany({ data: parseDates(data.match) });
            }
            if (data.matchMember && data.matchMember.length > 0) {
                await tx.matchMember.createMany({ data: parseDates(data.matchMember) });
            }
            if (data.matchChallenge && data.matchChallenge.length > 0) {
                await tx.matchChallenge.createMany({ data: parseDates(data.matchChallenge) });
            }
            if (data.auditLog && data.auditLog.length > 0) {
                await tx.auditLog.createMany({ data: parseDates(data.auditLog) });
            }
            if (data.memberQuest && data.memberQuest.length > 0) {
                await tx.memberQuest.createMany({ data: parseDates(data.memberQuest) });
            }
        }, {
            timeout: 60000 // 60 detik timeout (lebih banyak model)
        });

        return {
            success: true,
            message: 'Database berhasil di-restore dari JSON cadangan!'
        };
    }
}

