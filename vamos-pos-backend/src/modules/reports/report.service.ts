import { prisma } from '../../database/db';

export class ReportService {
    static async getTodayUtilizationSplit() {
        const now = new Date();
        // Adjust for UTC+8 (WITA) server offset
        const localNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const currentHour = localNow.getUTCHours();

        let startOfDay = new Date(localNow);
        if (currentHour < 6) {
            startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);
        }
        startOfDay.setUTCHours(6, 0, 0, 0);

        // Normalize back to UTC for Prisma query
        const dbStart = new Date(startOfDay.getTime() - (8 * 60 * 60 * 1000));
        const dbEnd = new Date(dbStart.getTime() + (24 * 60 * 60 * 1000));

        const sessions = await prisma.session.findMany({
            where: {
                startTime: { gte: dbStart, lte: dbEnd },
                tableId: { not: null }
            }
        });

        let dayMinutes = 0;
        let nightMinutes = 0;

        sessions.forEach(s => {
            if (!s.startTime) return;
            const end = s.endTime || new Date();
            const calcEnd = end > now ? now : end;

            if (calcEnd <= s.startTime) return;

            let current = new Date(s.startTime);
            // simple minute-by-minute simulation for exact day/night split calculation
            while (current < calcEnd) {
                const h = current.getHours();
                const isDay = h >= 6 && h < 18;
                if (isDay) dayMinutes++;
                else nightMinutes++;

                current.setMinutes(current.getMinutes() + 1);
            }
        });

        return {
            dayHours: (dayMinutes / 60).toFixed(1),
            nightHours: (nightMinutes / 60).toFixed(1)
        };
    }

    /**
     * OPERATIONAL DAY BOUNDS
     * ─────────────────────────────────────────────────────────────────────
     * Venue opens at OPEN_HOUR (default 10 = 10:00 AM) and the "business day"
     * ends at OPEN_HOUR the NEXT calendar day. So sessions that run past
     * midnight (23:00 → 02:00) still belong to the SAME operational day.
     *
     * Example (OPEN_HOUR = 10):
     *   - Operational day "2026-02-27" = 2026-02-27 10:00:00 → 2026-02-28 09:59:59
     *   - If current time is 03:00 AM on 2026-02-28, we're still in the
     *     2026-02-27 operational day.
     */
    /**
     * OPERATIONAL DAY BOUNDS
     * ─────────────────────────────────────────────────────────────────────
     * Venue opens at OPEN_HOUR (fetched from Venue settings) and the "business day"
     * ends at OPEN_HOUR the NEXT calendar day.
     */
    static async getOpenHour(): Promise<number> {
        const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        if (!venue || !venue.openTime) return 10; // Fallback to 10 AM
        return parseInt(venue.openTime.split(':')[0], 10);
    }

    /** Returns { start, end, label } for an operational day N days ago (0 = today/current). */
    static async getOperationalDayBounds(daysAgo = 0): Promise<{ start: Date; end: Date; label: string }> {
        const openHour = await ReportService.getOpenHour();
        const now = new Date();
        
        // Adjust server UTC to Venue Local (WITA +8)
        const localNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const pivotDate = new Date(localNow);
        
        if (localNow.getUTCHours() < openHour) {
            pivotDate.setUTCDate(pivotDate.getUTCDate() - 1);
        }
        // Move back daysAgo
        pivotDate.setUTCDate(pivotDate.getUTCDate() - daysAgo);

        const startLocal = new Date(pivotDate);
        startLocal.setUTCHours(openHour, 0, 0, 0);

        // Convert back to UTC for DB logic
        const start = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));
        const end = new Date(start.getTime() + (24 * 60 * 60 * 1000) - 1);

        const label = startLocal.toISOString().split('T')[0]; 
        return { start, end, label };
    }

    static async getDailyRevenue(days = 7, startDateStr?: string, endDateStr?: string) {
        const result = [];
        let datesToProcess: { start: Date, end: Date, label: string }[] = [];

        if (startDateStr && endDateStr) {
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
            
            const startParam = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            const endParam = new Date(Date.UTC(eYear, eMonth - 1, eDay));

            if (startParam <= endParam) {
                let currentDate = new Date(startParam);
                const openHour = await ReportService.getOpenHour();
                while (currentDate <= endParam) {
                    const startLocal = new Date(currentDate);
                    startLocal.setUTCHours(openHour, 0, 0, 0);

                    // Convert to UTC by subtracting 8 hours (WITA)
                    const start = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));
                    
                    const end = new Date(start.getTime() + (24 * 60 * 60 * 1000) - 1);

                    const label = startLocal.toISOString().split('T')[0];
                    datesToProcess.push({ start, end, label });

                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                }
            }
        } else {
            for (let i = days - 1; i >= 0; i--) {
                datesToProcess.push(await ReportService.getOperationalDayBounds(i));
            }
        }

        for (const { start, end, label } of datesToProcess) {
            // Find ALL successful payments within this operational window
            const payments = await prisma.payment.findMany({
                where: {
                    createdAt: { gte: start, lte: end },
                    status: 'SUCCESS'
                },
                include: {
                    session: {
                        include: {
                            table: true
                        }
                    }
                }
            });

            // Expenses (EXCLUDING DEBT trackers)
            const expenses = await prisma.expense.findMany({
                where: {
                    date: { gte: start, lte: end },
                    isDebt: false,
                    deletedAt: null
                }
            });

            let tableRevenue = 0;
            let fnbRevenue = 0;
            let otherRevenue = 0;
            let totalRevenue = 0;
            let totalExpenses = 0;
            const expenseDistribution: Record<string, number> = {};

            let qrisRevenue = 0;
            let qrisCount = 0;
            let cardRevenue = 0;
            
            payments.forEach(p => {
                totalRevenue += p.amount;
                if (p.method === 'QRIS') {
                    qrisRevenue += p.amount;
                    qrisCount++;
                } else if (p.method === 'CARD') {
                    cardRevenue += p.amount;
                }

                if (p.session) {
                    const sessionRec = p.session as any;
                    // Proportional split for table vs fnb revenue
                    const sessionTotalRaw = (sessionRec.tableAmount || 0) + (sessionRec.fnbAmount || 0) + (sessionRec.taxAmount || 0) + (sessionRec.serviceAmount || 0);
                    
                    if (sessionTotalRaw > 0) {
                        const tableRatio = (sessionRec.tableAmount || 0) / sessionTotalRaw;
                        tableRevenue += p.amount * tableRatio;
                        fnbRevenue += p.amount * (1 - tableRatio);
                    } else {
                        fnbRevenue += p.amount;
                    }
                } else {
                    // Payment without session (e.g., Tournament entry, Misc, or manual Debt payment)
                    otherRevenue += p.amount;
                }
            });

            expenses.forEach(e => {
                totalExpenses += e.amount || 0;
                expenseDistribution[e.category] = (expenseDistribution[e.category] || 0) + e.amount;
            });

            result.push({
                date: label,
                operationalStart: start.toISOString(),
                operationalEnd: end.toISOString(),
                tableRevenue,
                fnbRevenue,
                otherRevenue,
                qrisRevenue,
                qrisCount,
                cardRevenue,
                totalRevenue,
                totalExpenses,
                cashRevenue: totalRevenue - qrisRevenue - cardRevenue - totalExpenses,
                expenseDistribution,
                netRevenue: totalRevenue - totalExpenses,
                sessionCount: payments.filter(p => !!p.session).length
            });
        }
        return result;
    }

    /** Revenue for the CURRENT operational day (from OPEN_HOUR today or yesterday if before OPEN_HOUR). */
    static async getCurrentOperationalDayRevenue() {
        const { start, end, label } = await ReportService.getOperationalDayBounds(0);

        const payments = await prisma.payment.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                status: 'SUCCESS'
            },
            include: { session: true }
        });

        // Also include still-active sessions (estimate based on table rate)
        const activeSessions = await prisma.session.findMany({
            where: {
                startTime: { gte: start },
                status: 'ACTIVE'
            }
        });

        const expenses = await prisma.expense.findMany({
            where: { 
                date: { gte: start, lte: end },
                isDebt: false
            }
        });

        let revenue = 0;
        let fnbRevenue = 0;
        let tableRevenue = 0;
        let otherRevenue = 0;
        let totalExpenses = 0;
        let qrisRevenue = 0;
        let cardRevenue = 0;
        let qrisCount = 0;

        payments.forEach(p => {
            revenue += p.amount || 0;
            if (p.method === 'QRIS') {
                qrisRevenue += p.amount || 0;
                qrisCount++;
            } else if (p.method === 'CARD') {
                cardRevenue += p.amount || 0;
            }

            if (p.session) {
                const sessionRec = p.session as any;
                const sessionTotalRaw = (sessionRec.tableAmount || 0) + (sessionRec.fnbAmount || 0) + (sessionRec.taxAmount || 0) + (sessionRec.serviceAmount || 0);
                if (sessionTotalRaw > 0) {
                    const tableRatio = (sessionRec.tableAmount || 0) / sessionTotalRaw;
                    tableRevenue += p.amount * tableRatio;
                    fnbRevenue += p.amount * (1 - tableRatio);
                } else {
                    fnbRevenue += p.amount;
                }
            } else {
                otherRevenue += p.amount;
            }
        });

        expenses.forEach(e => { totalExpenses += e.amount || 0; });

        const now = new Date();
        const opensSince = start > now ? 0 : Math.floor((now.getTime() - start.getTime()) / 60000); // minutes since open

        return {
            date: label,
            operationalStart: start.toISOString(),
            revenue,
            tableRevenue,
            fnbRevenue,
            otherRevenue,
            qrisRevenue,
            cardRevenue,
            qrisCount,
            totalExpenses,
            cashRevenue: revenue - qrisRevenue - cardRevenue - totalExpenses,
            netRevenue: revenue - totalExpenses,
            sessionCount: payments.filter(p => !!p.session).length,
            activeSessions: activeSessions.length,
            minutesSinceOpen: opensSince,
            openHour: await ReportService.getOpenHour()
        };
    }

    static async getTableUtilization(days = 30, startDateStr?: string, endDateStr?: string) {
        const openHour = await ReportService.getOpenHour();
        let gteDate: Date;
        let lteDate: Date;

        if (startDateStr && endDateStr) {
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            gteDate = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            lteDate = new Date(endLocal.getTime() - (8 * 60 * 60 * 1000) - 1);
        } else {
            const today = await ReportService.getOperationalDayBounds(0);
            const oldest = await ReportService.getOperationalDayBounds(Math.max(days - 1, 0));
            gteDate = oldest.start;
            lteDate = today.end;
        }

        // --- Base: all tables (include zero-revenue tables) ---
        const allTables = await prisma.table.findMany();

        // --- Use Payment as source of truth (same as getDailyRevenue) ---
        const payments = await prisma.payment.findMany({
            where: { createdAt: { gte: gteDate, lte: lteDate }, status: 'SUCCESS' },
            include: { session: { include: { table: true } } }
        });

        // Build stats map, initialised for all tables
        const statsMap: Record<string, {
            tableName: string; type: string;
            totalMinutes: number; totalRevenue: number;
            sessionIds: Set<string>;
        }> = {};

        allTables.forEach(t => {
            statsMap[t.id] = { tableName: t.name, type: t.type, totalMinutes: 0, totalRevenue: 0, sessionIds: new Set() };
        });

        payments.forEach(p => {
            const s = p.session as any;
            if (!s || !s.tableId) return;
            const stat = statsMap[s.tableId];
            if (!stat) return;

            // Proportional table revenue — mirrors getDailyRevenue logic (post-discount)
            const sessionTotalRaw = (s.tableAmount || 0) + (s.fnbAmount || 0) + (s.taxAmount || 0) + (s.serviceAmount || 0);
            if (sessionTotalRaw > 0) {
                stat.totalRevenue += p.amount * ((s.tableAmount || 0) / sessionTotalRaw);
            }

            // Duration: count each unique session once
            if (!stat.sessionIds.has(s.id)) {
                stat.sessionIds.add(s.id);
                if (s.startTime && s.endTime) {
                    stat.totalMinutes += (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
                }
            }
        });

        return allTables.map(t => ({
            tableName: t.name,
            type: t.type,
            totalMinutes: statsMap[t.id]?.totalMinutes || 0,
            totalRevenue: statsMap[t.id]?.totalRevenue || 0,
            sessionCount: statsMap[t.id]?.sessionIds.size || 0,
        }));
    }

    static async getTopPlayers(days = 30, startDateStr?: string, endDateStr?: string) {
        let start: Date;
        let end: Date;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - (8 * 60 * 60 * 1000) - 1);
        } else {
            const today = await ReportService.getOperationalDayBounds(0);
            const oldest = await ReportService.getOperationalDayBounds(Math.max(days - 1, 0));
            start = oldest.start;
            end = today.end;
        }

        const dateFilter = { endTime: { gte: start, lte: end } };

        const members = await prisma.member.findMany({
            include: {
                sessions: {
                    where: {
                        status: 'PAID',
                        ...dateFilter
                    }
                }
            }
        });

        const playerStats = members.map(m => {
            let totalSpent = 0;
            m.sessions.forEach(s => totalSpent += s.totalAmount || 0);
            return {
                name: m.name,
                phone: m.phone,
                totalSessions: m.sessions.length,
                totalSpent
            };
        });

        // Add walk-in customer (non-member) aggregation
        const nonMemberSessions = await prisma.session.findMany({
            where: {
                memberId: null,
                status: 'PAID',
                ...dateFilter
            }
        });

        let walkInSpent = 0;
        nonMemberSessions.forEach(s => walkInSpent += s.totalAmount || 0);

        if (nonMemberSessions.length > 0) {
            playerStats.push({
                name: 'Walk-in Customer (Guest)',
                phone: '-',
                totalSessions: nonMemberSessions.length,
                totalSpent: walkInSpent
            });
        }

        return playerStats.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    }

    static async getTopProducts(days = 30, startDateStr?: string, endDateStr?: string) {
        let start: Date;
        let end: Date;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - (8 * 60 * 60 * 1000) - 1);
        } else {
            const today = await ReportService.getOperationalDayBounds(0);
            const oldest = await ReportService.getOperationalDayBounds(Math.max(days - 1, 0));
            start = oldest.start;
            end = today.end;
        }

        const dateFilter = { createdAt: { gte: start, lte: end } };

        const orders = await prisma.order.findMany({
            where: {
                session: {
                    status: 'PAID',
                },
                ...dateFilter
            },
            include: { product: true }
        });

        const productSales: Record<string, { product: any, quantitySold: number, revenue: number }> = {};

        orders.forEach(item => {
            if (!item.product) return;
            const pid = item.product.id;
            if (!productSales[pid]) {
                productSales[pid] = { product: item.product, quantitySold: 0, revenue: 0 };
            }
            productSales[pid].quantitySold += item.quantity;
            productSales[pid].revenue += (item.price * item.quantity);
        });

        const sorted = Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
        return sorted;
    }

    static async getTransactionList(days = 1, startDateStr?: string, endDateStr?: string) {
        let gteDate: Date;
        let lteDate: Date | undefined;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            gteDate = new Date(startLocal.getTime() - (8 * 60 * 60 * 1000));

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            lteDate = new Date(endLocal.getTime() - (8 * 60 * 60 * 1000) - 1);
        } else {
            // Always set both bounds to prevent unbounded queries
            const { start } = await ReportService.getOperationalDayBounds(days - 1);
            const { end } = await ReportService.getOperationalDayBounds(0);
            gteDate = start;
            lteDate = end;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payments = await prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                createdAt: lteDate ? { gte: gteDate, lte: lteDate } : { gte: gteDate }
            },
            include: {
                session: {
                    include: {
                        member: true,
                        table: true,
                        orders: { include: { product: true } },
                        package: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return payments.map((p: any) => {
            const s = p.session;
            if (!s) {
                // Return a simplified payment record if not linked to a session
                return {
                    id: p.id,
                    date: p.createdAt.toISOString(),
                    memberName: p.notes || 'Debt Payment / Custom',
                    totalAmount: p.amount,
                    paymentMethod: p.method,
                    tableName: '-',
                    orderSummary: {}
                };
            }
            
            const durationMinutes = s.startTime && s.endTime
                ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
                : s.durationOpts || 0;

            const orderSummary = (s.orders || []).reduce((acc: Record<string, number>, o: any) => {
                const name = o.product?.name || 'Unknown';
                acc[name] = (acc[name] || 0) + o.quantity;
                return acc;
            }, {});

            return {
                id: p.id,
                sessionId: s.id,
                date: p.createdAt.toISOString(),
                startTime: s.startTime ? new Date(s.startTime).toISOString() : null,
                endTime: s.endTime ? new Date(s.endTime).toISOString() : null,
                memberName: s.member?.name || s.customerName || 'Walk-in Guest',
                memberPhone: s.member?.phone || '-',
                tableName: s.table?.name || '-',
                tableType: s.table?.type || '-',
                durationMinutes,
                packageName: s.package?.name || null,
                tableAmount: s.tableAmount || 0,
                fnbAmount: s.fnbAmount || 0,
                totalAmount: p.amount, // Real amount paid
                paymentMethod: p.method,
                orderSummary,
                ordersCount: (s.orders || []).length,
            };
        });
    }
}
