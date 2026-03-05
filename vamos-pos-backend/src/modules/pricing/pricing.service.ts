import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class PricingService {
    // --- PRICING RULE CRUD ---
    static async createPricingRule(data: { name: string; tableType: string; dayOfWeek: number[]; startTime: string; endTime: string; ratePerHour: number; memberRatePerHour?: number; isActive?: boolean }) {
        return prisma.pricingRule.create({ data });
    }

    static async getPricingRules() {
        return prisma.pricingRule.findMany({ where: { deletedAt: null } });
    }

    static async updatePricingRule(id: string, data: any) {
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
        return prisma.package.create({ data });
    }

    static async getPackages() {
        return prisma.package.findMany({ where: { deletedAt: null } });
    }

    static async updatePackage(id: string, data: any) {
        return prisma.package.update({ where: { id }, data });
    }

    static async deletePackage(id: string) {
        return prisma.package.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    }

    // --- PRICING LOGIC ---
    static async calculateTableAmount(tableType: string, startTime: Date, endTime: Date, isMember: boolean = false): Promise<number> {
        const totalMinutes = Math.max(1, (endTime.getTime() - startTime.getTime()) / 60000);
        const totalHours = Math.ceil(totalMinutes / 60);

        const rules = await prisma.pricingRule.findMany({
            where: { tableType: { equals: tableType, mode: 'insensitive' }, isActive: true, deletedAt: null },
        });

        let totalAmount = 0;
        let currentTime = new Date(startTime);

        for (let i = 0; i < totalHours; i++) {
            const hourToCheck = new Date(currentTime.getTime() + i * 3600000);
            const currentDay = hourToCheck.getDay();
            const currentHour = hourToCheck.getHours();
            const currentMin = hourToCheck.getMinutes();
            const currentHourStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

            // Find rule for the start of this hour block
            const rule = rules.find(r => {
                const dayMatch = r.dayOfWeek.includes(currentDay);
                if (!dayMatch) return false;

                if (r.startTime <= r.endTime) {
                    return currentHourStr >= r.startTime && currentHourStr < r.endTime;
                } else {
                    // Rule spans midnight (e.g., 22:00 to 04:00)
                    return currentHourStr >= r.startTime || currentHourStr < r.endTime;
                }
            });

            const isNight = currentHour >= 18 || currentHour < 4;
            // Use IDR amounts for fallback
            const fallbackRate = isMember ? (isNight ? 35000 : 25000) : (isNight ? 45000 : 35000);

            let hourlyRate = rule
                ? (isMember && rule.memberRatePerHour ? rule.memberRatePerHour : rule.ratePerHour)
                : fallbackRate;

            // Ensure rate is in Rupiah (e.g. if it's 35, treat it as 35000)
            if (hourlyRate < 1000) {
                hourlyRate = hourlyRate * 1000;
            }

            totalAmount += hourlyRate;
        }

        return Math.round(totalAmount);
    }

    static async estimatePrice(tableType: string, durationMinutes: number, isMember: boolean = false, startTime: Date = new Date()): Promise<number> {
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        return this.calculateTableAmount(tableType, startTime, endTime, isMember);
    }
}
