import { prisma } from '../../database/db';
import { getTimezoneOffsetMs } from '../../utils/timezone.utils';

export class ReportService {
    static async getTodayUtilizationSplit() {
        const now = new Date();
        const tzOffsetMs = getTimezoneOffsetMs();
        const localNow = new Date(now.getTime() + tzOffsetMs);
        const currentHour = localNow.getUTCHours();

        let startOfDay = new Date(localNow);
        if (currentHour < 6) {
            startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);
        }
        startOfDay.setUTCHours(6, 0, 0, 0);

        // Normalize back to UTC for Prisma query
        const dbStart = new Date(startOfDay.getTime() - tzOffsetMs);
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
                // Adjust current UTC to venue's timezone offset
                const localDate = new Date(current.getTime() + tzOffsetMs);
                const h = localDate.getUTCHours();
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
        
        // Adjust server UTC to Venue Local time
        const tzOffsetMs = getTimezoneOffsetMs();
        const localNow = new Date(now.getTime() + tzOffsetMs);
        const pivotDate = new Date(localNow);
        
        if (localNow.getUTCHours() < openHour) {
            pivotDate.setUTCDate(pivotDate.getUTCDate() - 1);
        }
        // Move back daysAgo
        pivotDate.setUTCDate(pivotDate.getUTCDate() - daysAgo);

        const startLocal = new Date(pivotDate);
        startLocal.setUTCHours(openHour, 0, 0, 0);

        // Convert back to UTC for DB
        const start = new Date(startLocal.getTime() - tzOffsetMs);
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
                const tzOffsetMs = getTimezoneOffsetMs();
                while (currentDate <= endParam) {
                    const startLocal = new Date(currentDate);
                    startLocal.setUTCHours(openHour, 0, 0, 0);

                    const start = new Date(startLocal.getTime() - tzOffsetMs);
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

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            gteDate = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            lteDate = new Date(endLocal.getTime() - tzOffsetMs - 1);
        } else {
            const today = await ReportService.getOperationalDayBounds(0);
            const oldest = await ReportService.getOperationalDayBounds(Math.max(days - 1, 0));
            gteDate = oldest.start;
            lteDate = today.end;
        }

        // --- Base: all tables (include zero-revenue tables, exclude soft-deleted) ---
        const allTables = await prisma.table.findMany({
            where: { deletedAt: null }
        });

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

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - tzOffsetMs - 1);
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

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - tzOffsetMs - 1);
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

        const sorted = Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold);
        return sorted;
    }

    static async getFnbHistory(days = 30, startDateStr?: string, endDateStr?: string) {
        let start: Date;
        let end: Date;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - tzOffsetMs - 1);
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
            include: { 
                product: true,
                session: {
                    include: {
                        member: true,
                        table: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return orders
            .filter(o => o.product) // Only F&B items
            .map(o => {
                const s = o.session as any;
                return {
                    id: o.id,
                    createdAt: o.createdAt.toISOString(),
                    productName: o.product?.name || '-',
                    category: o.product?.category || '-',
                    price: o.price,
                    quantity: o.quantity,
                    totalPrice: o.price * o.quantity,
                    memberName: s?.member?.name || s?.customerName || 'Walk-in Guest',
                    tableName: s?.table?.name || '-'
                };
            });
    }

    static async getTransactionList(days = 1, startDateStr?: string, endDateStr?: string) {
        let gteDate: Date;
        let lteDate: Date | undefined;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            gteDate = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            lteDate = new Date(endLocal.getTime() - tzOffsetMs - 1);
        } else {
            // Always set both bounds to prevent unbounded queries
            const { start } = await ReportService.getOperationalDayBounds(days - 1);
            const { end } = await ReportService.getOperationalDayBounds(0);
            gteDate = start;
            lteDate = end;
            console.log(`[ReportService] Default Range (${days} days): gte: ${gteDate.toISOString()} | lte: ${lteDate?.toISOString()}`);
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

    /**
     * FnB COGS, Laba Rugi Kafe, dan Menu Engineering Matrix Analytics
     */
    static async getFnbCogsAnalytics(days = 30, startDateStr?: string, endDateStr?: string) {
        let start: Date;
        let end: Date;

        if (startDateStr && endDateStr) {
            const openHour = await ReportService.getOpenHour();
            const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

            const tzOffsetMs = getTimezoneOffsetMs();
            const startLocal = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            startLocal.setUTCHours(openHour, 0, 0, 0);
            start = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(Date.UTC(eYear, eMonth - 1, eDay));
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour, 0, 0, 0);
            end = new Date(endLocal.getTime() - tzOffsetMs - 1);
        } else {
            const today = await ReportService.getOperationalDayBounds(0);
            const oldest = await ReportService.getOperationalDayBounds(Math.max(days - 1, 0));
            start = oldest.start;
            end = today.end;
        }

        const dateFilter = { createdAt: { gte: start, lte: end } };

        // 1. Fetch Orders with product & recipes
        const orders = await prisma.order.findMany({
            where: {
                ...dateFilter
            },
            include: {
                product: {
                    include: {
                        recipes: {
                            include: {
                                rawMaterial: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Fetch Waste Logs in same period
        const wasteLogs = await prisma.wasteLog.findMany({
            where: {
                ...dateFilter
            }
        });

        let totalFnbRevenue = 0;
        let totalCogs = 0;
        let totalItemsSold = 0;

        const productMap: Record<string, {
            id: string;
            name: string;
            category: string;
            quantitySold: number;
            revenue: number;
            cogs: number;
            grossProfit: number;
            marginPercent: number;
        }> = {};

        for (const order of orders) {
            if (!order.product) continue;

            const pId = order.product.id;
            const orderQty = order.quantity || 1;
            const revenue = order.total !== undefined ? order.total : (order.price * orderQty);

            // Compute unit HPP from recipes
            let unitHpp = 0;
            if (order.product.recipes && order.product.recipes.length > 0) {
                for (const r of order.product.recipes) {
                    unitHpp += (r.quantity || 0) * (r.rawMaterial?.costPerUnit || 0);
                }
            }
            const orderCogs = unitHpp * orderQty;

            totalFnbRevenue += revenue;
            totalCogs += orderCogs;
            totalItemsSold += orderQty;

            if (!productMap[pId]) {
                productMap[pId] = {
                    id: pId,
                    name: order.product.name,
                    category: order.product.category || 'Uncategorized',
                    quantitySold: 0,
                    revenue: 0,
                    cogs: 0,
                    grossProfit: 0,
                    marginPercent: 0
                };
            }

            productMap[pId].quantitySold += orderQty;
            productMap[pId].revenue += revenue;
            productMap[pId].cogs += orderCogs;
        }

        const productsList = Object.values(productMap).map(p => {
            const grossProfit = p.revenue - p.cogs;
            const marginPercent = p.revenue > 0 ? Number(((grossProfit / p.revenue) * 100).toFixed(1)) : 0;
            return {
                ...p,
                revenue: Math.round(p.revenue),
                cogs: Math.round(p.cogs),
                grossProfit: Math.round(grossProfit),
                marginPercent
            };
        });

        const grossProfit = totalFnbRevenue - totalCogs;
        const grossMarginPercent = totalFnbRevenue > 0 ? Number(((grossProfit / totalFnbRevenue) * 100).toFixed(1)) : 0;
        const totalWasteCost = wasteLogs.reduce((acc, w) => acc + (w.costLoss || 0), 0);
        const netFnbProfit = grossProfit - totalWasteCost;

        // 3. Menu Engineering Classification (Stars, Plowhorses, Puzzles, Dogs)
        const avgQty = productsList.length > 0 ? (totalItemsSold / productsList.length) : 0;
        const avgMargin = grossMarginPercent;

        const menuEngineering = productsList.map(p => {
            const isHighVol = p.quantitySold >= avgQty;
            const isHighMargin = p.marginPercent >= avgMargin;

            let classification: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';
            if (isHighVol && isHighMargin) classification = 'STAR';
            else if (isHighVol && !isHighMargin) classification = 'PLOWHORSE';
            else if (!isHighVol && isHighMargin) classification = 'PUZZLE';
            else classification = 'DOG';

            return {
                ...p,
                classification
            };
        }).sort((a, b) => b.revenue - a.revenue);

        return {
            summary: {
                totalFnbRevenue: Math.round(totalFnbRevenue),
                totalCogs: Math.round(totalCogs),
                grossProfit: Math.round(grossProfit),
                grossMarginPercent,
                totalWasteCost: Math.round(totalWasteCost),
                netFnbProfit: Math.round(netFnbProfit),
                totalOrdersCount: orders.length,
                totalItemsSold
            },
            menuEngineering,
            benchmark: {
                avgQty: Math.round(avgQty * 10) / 10,
                avgMargin
            }
        };
    }

    static async getVoucherBurnReport(days = 30, startDate?: string, endDate?: string) {
        let dbStart: Date;
        let dbEnd: Date;

        if (startDate && endDate) {
            const openHour = await ReportService.getOpenHour();
            const tzOffsetMs = getTimezoneOffsetMs();

            const startLocal = new Date(`${startDate}T00:00:00.000Z`);
            startLocal.setUTCHours(openHour, 0, 0, 0);
            dbStart = new Date(startLocal.getTime() - tzOffsetMs);

            const endLocal = new Date(`${endDate}T00:00:00.000Z`);
            endLocal.setUTCDate(endLocal.getUTCDate() + 1);
            endLocal.setUTCHours(openHour - 1, 59, 59, 999);
            dbEnd = new Date(endLocal.getTime() - tzOffsetMs);
        } else {
            const bounds = await ReportService.getOperationalDayBounds(days <= 1 ? 0 : days);
            dbStart = bounds.start;
            dbEnd = bounds.end;
        }

        const redemptions = await prisma.redemption.findMany({
            where: {
                status: 'DELIVERED',
                deliveredAt: { gte: dbStart, lte: dbEnd }
            },
            include: {
                member: { select: { id: true, name: true, phone: true } },
                reward: true
            },
            orderBy: { deliveredAt: 'desc' }
        });

        const payments = await prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: dbStart, lte: dbEnd }
            },
            select: { amount: true }
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        let totalRupiahBurned = 0;
        let totalCostBurned = 0;
        let totalPointsBurned = 0;

        const categorySummary: Record<string, { count: number; rupiah: number; points: number }> = {
            TABLE: { count: 0, rupiah: 0, points: 0 },
            FNB: { count: 0, rupiah: 0, points: 0 },
            MERCHANDISE: { count: 0, rupiah: 0, points: 0 },
            OTHER: { count: 0, rupiah: 0, points: 0 }
        };

        const details = redemptions.map(r => {
            const titleLower = (r.reward.title || '').toLowerCase();
            const isTable = titleLower.includes('meja') || titleLower.includes('table') || titleLower.includes('jam') || titleLower.includes('hour') || titleLower.includes('biliar') || titleLower.includes('billiard');
            const nominal = r.reward.nominalValue || (r.reward.value > 0 ? r.reward.value : (isTable ? 40000 : 0));
            const cost = r.reward.costPrice || 0;
            const points = r.pointsUsed || r.reward.pointsRequired || 0;
            const rawCat = (r.reward.category || '').toUpperCase();
            const cat = ['TABLE', 'FNB', 'MERCHANDISE'].includes(rawCat) ? rawCat : (
                isTable ? 'TABLE' : (
                    titleLower.includes('tea') || titleLower.includes('kopi') || titleLower.includes('snack') || titleLower.includes('drink') || titleLower.includes('appetizer') || titleLower.includes('food') || titleLower.includes('beverage') ? 'FNB' : 'MERCHANDISE'
                )
            );

            totalRupiahBurned += nominal;
            totalCostBurned += cost;
            totalPointsBurned += points;

            if (!categorySummary[cat]) {
                categorySummary[cat] = { count: 0, rupiah: 0, points: 0 };
            }
            categorySummary[cat].count += 1;
            categorySummary[cat].rupiah += nominal;
            categorySummary[cat].points += points;

            return {
                id: r.id,
                date: r.deliveredAt || r.claimedAt,
                memberName: r.member?.name || 'Unknown',
                memberPhone: r.member?.phone || '',
                rewardTitle: r.reward.title,
                category: cat,
                pointsUsed: points,
                nominalValue: nominal,
                costPrice: cost,
                cashierId: r.cashierId,
                sessionId: r.sessionId
            };
        });

        const burnRatio = totalRevenue > 0 ? Number(((totalRupiahBurned / totalRevenue) * 100).toFixed(2)) : 0;

        return {
            summary: {
                totalRupiahBurned,
                totalCostBurned,
                totalPointsBurned,
                totalVouchersBurned: redemptions.length,
                totalRevenue,
                burnRatio
            },
            categorySummary,
            details
        };
    }
}
