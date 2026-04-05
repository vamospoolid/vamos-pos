import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function rangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    const start1 = timeToMinutes(s1);
    const end1 = timeToMinutes(e1);
    const start2 = timeToMinutes(s2);
    const end2 = timeToMinutes(e2);

    const getParts = (s: number, e: number) => {
        if (s < e) return [[s, e]];
        if (s === e) return [[0, 1440]]; // Full day
        return [[s, 1440], [0, e]];
    };

    const parts1 = getParts(start1, end1);
    const parts2 = getParts(start2, end2);

    for (const p1 of parts1) {
        for (const p2 of parts2) {
            const maxStart = Math.max(p1[0], p2[0]);
            const minEnd = Math.min(p1[1], p2[1]);
            if (maxStart < minEnd) return true;
        }
    }
    return false;
}

export class PricingService {
    // --- PRICING RULE CRUD ---
    static async createPricingRule(data: { name: string; tableType: string; dayOfWeek: number[]; startTime: string; endTime: string; ratePerHour: number; memberRatePerHour?: number; isActive?: boolean }) {
        const existing = await prisma.pricingRule.findMany({
            where: { isActive: true, deletedAt: null }
        });

        for (const rule of existing) {
            const hasCommonDay = data.dayOfWeek.some(d => rule.dayOfWeek.includes(d));
            const tableTypeMatch = rule.tableType.toUpperCase() === data.tableType.toUpperCase();
            if (hasCommonDay && tableTypeMatch && rangesOverlap(data.startTime, data.endTime, rule.startTime, rule.endTime)) {
                throw new AppError(`Overlap detected with rule "${rule.name}" for the same time slot and table type.`, 400);
            }
        }

        return prisma.pricingRule.create({ data });
    }

    static async getPricingRules() {
        return prisma.pricingRule.findMany({ where: { deletedAt: null } });
    }

    static async updatePricingRule(id: string, data: any) {
        if (data.startTime || data.endTime || data.ratePerHour || data.name) {
            const current = await prisma.pricingRule.findUnique({ where: { id } });
            if (current) {
                const tableType = data.tableType || current.tableType;
                const startTime = data.startTime || current.startTime;
                const endTime = data.endTime || current.endTime;
                const ratePerHour = data.ratePerHour || current.ratePerHour;
                const name = data.name || current.name;
                const days = data.dayOfWeek || current.dayOfWeek;

                const existing = await prisma.pricingRule.findMany({
                    where: { tableType, isActive: true, deletedAt: null, NOT: { id } }
                });

                for (const rule of existing) {
                    const hasCommonDay = days.some((d: number = 0) => rule.dayOfWeek.includes(d));
                    if (hasCommonDay && rangesOverlap(startTime, endTime, rule.startTime, rule.endTime)) {
                        throw new AppError(`Overlap detected with existing rule "${rule.name}".`, 400);
                    }
                }
            }
        }
        return prisma.pricingRule.update({ where: { id }, data });
    }

    static async deletePricingRule(id: string) {
        return prisma.pricingRule.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    }

    // --- PACKAGE CRUD ---
    static async createPackage(data: {
        name: string;
        tableType: string;
        duration: number;
        price: number;
        memberPrice?: number;
        fnbItems?: string;
        startTime?: string;
        endTime?: string;
        dayOfWeek?: number[];
        isActive?: boolean
    }) {
        if (data.startTime && data.endTime) {
            const existing = await prisma.package.findMany({
                where: { tableType: data.tableType, isActive: true, deletedAt: null }
            });

            for (const pkg of existing) {
                if (!pkg.startTime || !pkg.endTime) continue;
                const dataDays = data.dayOfWeek || [0, 1, 2, 3, 4, 5, 6];
                const pkgDays = pkg.dayOfWeek || [0, 1, 2, 3, 4, 5, 6];
                const hasCommonDay = dataDays.some(d => pkgDays.includes(d));
                const tableTypeMatch = pkg.tableType.toUpperCase() === data.tableType.toUpperCase();

                if (hasCommonDay && tableTypeMatch && rangesOverlap(data.startTime, data.endTime, pkg.startTime, pkg.endTime)) {
                    if (pkg.name.toLowerCase() === data.name.toLowerCase()) {
                        throw new AppError('Package name conflict in overlapping time.', 400);
                    }
                    if (pkg.price === data.price) {
                        throw new AppError(`Overlap detected with package "${pkg.name}" having same price.`, 400);
                    }
                }
            }
        }
        return prisma.package.create({ data });
    }

    static async getPackages() {
        return prisma.package.findMany({ where: { deletedAt: null } });
    }

    static async updatePackage(id: string, data: any) {
        if ((data.startTime && data.endTime) || data.price || data.name) {
            const current = await prisma.package.findUnique({ where: { id } });
            if (current) {
                const tableType = data.tableType || current.tableType;
                const startTime = data.startTime || current.startTime;
                const endTime = data.endTime || current.endTime;
                const price = data.price || current.price;
                const name = data.name || current.name;
                const days = data.dayOfWeek || current.dayOfWeek || [0, 1, 2, 3, 4, 5, 6];

                if (startTime && endTime) {
                    const existing = await prisma.package.findMany({
                        where: { tableType, isActive: true, deletedAt: null, NOT: { id } }
                    });

                    for (const pkg of existing) {
                        if (!pkg.startTime || !pkg.endTime) continue;
                        const pkgDays = pkg.dayOfWeek || [0, 1, 2, 3, 4, 5, 6];
                        const hasCommonDay = days.some((d: number) => pkgDays.includes(d));

                        if (hasCommonDay && rangesOverlap(startTime, endTime, pkg.startTime, pkg.endTime)) {
                            if (pkg.name.toLowerCase() === name.toLowerCase()) {
                                throw new AppError('Overlapping package name conflict.', 400);
                            }
                            if (pkg.price === price) {
                                throw new AppError(`Price conflict with overlapping package "${pkg.name}".`, 400);
                            }
                        }
                    }
                }
            }
        }
        return prisma.package.update({ where: { id }, data });
    }

    static async deletePackage(id: string) {
        return prisma.package.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    }

    // --- PRICING LOGIC ---
    static async calculateTableAmount(tableType: string, startTime: Date, endTime: Date, isMember: boolean = false): Promise<number> {
        let totalMs = Math.max(0, endTime.getTime() - startTime.getTime());
        const totalMinutes = Math.floor(totalMs / 60000); // jumlah menit membulat ke bawah
        
        if (totalMinutes <= 0) return 0;

        const rules = await prisma.pricingRule.findMany({
            where: { tableType: { equals: tableType, mode: 'insensitive' }, isActive: true, deletedAt: null },
        });

        let totalAmount = 0;

        // Loop per-menit untuk mengakomodir perubahan tarif per jam ganjil (pergantian waktu)
        for (let i = 0; i < totalMinutes; i++) {
            const minToCheck = new Date(startTime.getTime() + i * 60000);
            
            // MEMENANGKAN TARIF: Paksa semua kalkulasi membaca waktu lokal Makassar (WITA / UTC+8)
            // VPS di Linux mungkin menggunakan kalender UTC, jadi kita tidak bisa pakai getHours() biasa.
            const localMs = minToCheck.getTime() + (8 * 60 * 60 * 1000);
            const localDate = new Date(localMs);
            
            const currentDay = localDate.getUTCDay();
            const currentHour = localDate.getUTCHours();
            const currentMin = localDate.getUTCMinutes();
            const currentHourStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

            const rule = rules.find(r => {
                const dayMatch = r.dayOfWeek.includes(currentDay);
                if (!dayMatch) return false;

                if (r.startTime <= r.endTime) {
                    return currentHourStr >= r.startTime && currentHourStr < r.endTime;
                } else {
                    return currentHourStr >= r.startTime || currentHourStr < r.endTime;
                }
            });

            // Default fallback logic
            const isNight = currentHour >= 18 || currentHour < 4;
            let fallbackRate = isMember ? (isNight ? 35000 : 25000) : (isNight ? 45000 : 35000);

            // Special case for Exhibition Area & Fight Mode (500/Min = 30k/Hour)
            if (['EXEBITION', 'FIGHT'].includes(tableType.toUpperCase())) {
                fallbackRate = 30000;
            }

            let hourlyRate = rule
                ? (isMember && rule.memberRatePerHour ? rule.memberRatePerHour : rule.ratePerHour)
                : fallbackRate;

            if (hourlyRate > 0 && hourlyRate < 1000) {
                hourlyRate = hourlyRate * 1000;
            }

            // Tambahkan fraksi per-menit ke total tagihan
            totalAmount += (hourlyRate / 60);
        }

        return Math.round(totalAmount);
    }

    static async estimatePrice(tableType: string, durationMinutes: number, isMember: boolean = false, startTime: Date = new Date()): Promise<number> {
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        return this.calculateTableAmount(tableType, startTime, endTime, isMember);
    }
}
