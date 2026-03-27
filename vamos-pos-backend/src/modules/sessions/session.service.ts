import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { RelayService } from '../relay/relay.service';
import { PricingService } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';
import { MemberService } from '../members/member.service';
import { getIO } from '../../socket';
import { logger } from '../../utils/logger';

/** Emit socket event secara fire-and-forget — tidak pernah crash main flow */
function emitSocket(event: string, data: object) {
    try {
        const io = getIO();
        if (io) io.emit(event, data);
    } catch (e) {
        logger.warn(`[Socket] Gagal emit '${event}': ${e}`);
    }
}

export class SessionService {
    static async updateSession(sessionId: string, data: any, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new AppError('Session not found', 404);

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                memberId: data.memberId === undefined ? session.memberId : data.memberId,
                customerName: data.customerName === undefined ? session.customerName : data.customerName,
            } as any,
            include: { member: true, table: true }
        });

        AuditService.log(userId, 'SESSION_UPDATE', 'Session', { sessionId, ...data }).catch(() => { });
        emitSocket('session:updated', { sessionId });
        return updatedSession;
    }

    static async startSession(tableId: string, userId: string, packageId?: string, memberId?: string, customDurationOpts?: number, overrideAmount?: number, billingType?: string) {
        // --- TRANSAKSI UNTUK CEGAH RACE CONDITION ---
        const session = await prisma.$transaction(async (tx) => {
            // 1. Cek status meja terbaru (serializable update)
            const table = await tx.table.findUnique({
                where: { id: tableId },
                select: { id: true, status: true, relayChannel: true, type: true }
            });

            if (!table || table.status !== 'AVAILABLE') {
                throw new AppError('Meja sudah terisi atau tidak tersedia!', 400);
            }

            // 2. Hitung durasi & harga
            let durationOpts = null;
            let tableAmount = 0;
            let fnbIncluded = null;

            if (packageId) {
                const pkg = await tx.package.findUnique({ where: { id: packageId } });
                if (!pkg) throw new AppError('Paket tidak ditemukan!', 404);
                durationOpts = pkg.duration;
                tableAmount = (memberId && pkg.memberPrice) ? pkg.memberPrice : pkg.price;
                fnbIncluded = pkg.fnbItems;
            } else if (customDurationOpts) {
                durationOpts = customDurationOpts;
                const now = new Date();
                const mockEndTime = new Date(now.getTime() + durationOpts * 60000);
                const isMember = !!memberId;
                // Use provided billingType or fallback to table's default type
                const calculationType = billingType || table.type;
                tableAmount = await PricingService.calculateTableAmount(calculationType, now, mockEndTime, isMember);
            }

            if (overrideAmount !== undefined) {
                tableAmount = overrideAmount;
            }

            // 3. Buat Sesi & Update Meja serentak
            const newSession = await tx.session.create({
                data: {
                    tableId,
                    packageId,
                    memberId,
                    durationOpts: Number(durationOpts),
                    tableAmount,
                    fnbIncluded,
                    status: 'ACTIVE',
                    cashierId: userId,
                    billingType: billingType || null,
                },
                include: { table: true }
            });

            await tx.table.update({
                where: { id: tableId },
                data: { status: 'PLAYING' }
            });

            return newSession;
        });

        // 4. FIRE-AND-FORGET (Diluar transaksi agar tidak membebani DB)
        if (session.table) {
            RelayService.sendCommand(session.table.relayChannel, 'on').catch(e => logger.error(`[RELAY] Error start: ${e.message}`));
        }
        
        AuditService.log(userId, 'SESSION_START', 'Session', { sessionId: session.id, tableId }).catch(() => { });
        
        // Broadcast ke semua kasir & admin
        emitSocket('session:start', { sessionId: session.id, tableId, status: 'ACTIVE' });
        emitSocket('table:update', { tableId, status: 'PLAYING' });

        return session;
    }


    static async moveSession(sessionId: string, newTableId: string, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { table: true } });
        if (!session || session.status !== 'ACTIVE') throw new AppError('Invalid session', 400);

        const newTable = await prisma.table.findUnique({ where: { id: newTableId } });
        if (!newTable || newTable.status !== 'AVAILABLE') throw new AppError('New table is not available', 400);

        await prisma.$transaction(async (tx) => {
            if (session.tableId && session.table) {
                await tx.table.update({ where: { id: session.tableId }, data: { status: 'AVAILABLE' } });
                await RelayService.sendCommand(session.table.relayChannel, 'off');
            }
            await tx.table.update({ where: { id: newTableId }, data: { status: 'PLAYING' } });
            await tx.session.update({ where: { id: sessionId }, data: { tableId: newTableId } });
        });

        await RelayService.sendCommand(newTable.relayChannel, 'on');

        await AuditService.log(userId, 'SESSION_MOVE', 'Session', { sessionId, fromTable: session.tableId, toTable: newTableId });
        emitSocket('session:move', { sessionId, fromTable: session.tableId, toTable: newTableId });
        if (session.tableId) emitSocket('table:update', { tableId: session.tableId, status: 'AVAILABLE' });
        emitSocket('table:update', { tableId: newTableId, status: 'PLAYING' });
        return { success: true };
    }

    static async addDuration(sessionId: string, userId: string, packageId?: string, customDurationOpts?: number) {
        const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { table: true } });
        if (!session || session.status !== 'ACTIVE') throw new AppError('Invalid session', 400);

        let extraDuration = 0;
        let extraAmount = 0;

        if (packageId) {
            const pkg = await prisma.package.findUnique({ where: { id: packageId } });
            if (!pkg) throw new AppError('Package not found', 404);
            extraDuration = pkg.duration;
            extraAmount = (session.memberId && pkg.memberPrice) ? pkg.memberPrice : pkg.price;
        } else if (customDurationOpts) {
            if (!session.table) throw new AppError('Session has no table', 400);
            extraDuration = customDurationOpts;
            const now = new Date();
            const mockEndTime = new Date(now.getTime() + extraDuration * 60000);
            const isMember = !!session.memberId;
            extraAmount = await PricingService.calculateTableAmount(session.table.type, now, mockEndTime, isMember);
        }

        const pkgData = packageId ? await prisma.package.findUnique({ where: { id: packageId } }) : null;
        const extraFnb = pkgData?.fnbItems;

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                durationOpts: (session.durationOpts || 0) + extraDuration,
                tableAmount: session.tableAmount + extraAmount,
                fnbIncluded: session.fnbIncluded ? (session.fnbIncluded + (extraFnb ? `, ${extraFnb}` : '')) : extraFnb
            }
        });

        await AuditService.log(userId, 'SESSION_ADD_DURATION', 'Session', { sessionId, extraDuration, extraAmount });
        emitSocket('session:update', { sessionId, type: 'ADD_DURATION', extraDuration });
        return updatedSession;
    }

    static async endSession(sessionId: string, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { table: true } });
        if (!session || session.status !== 'ACTIVE') throw new AppError('Invalid session', 400);

        const endTime = new Date();

        const isMember = !!session.memberId;
        let tableAmount = session.tableAmount;

        // Calculate Open Time billing ONLY if no package and no custom duration was pre-selected
        if (!session.packageId && !session.durationOpts && session.table) {
            const calculationType = session.billingType || session.table.type;
            tableAmount = await PricingService.calculateTableAmount(calculationType, session.startTime, endTime, isMember);
        }

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'FINISHED',
                endTime,
                tableAmount,
                totalAmount: tableAmount + session.fnbAmount,
                taxAmount: 0,
                serviceAmount: 0,
            } as any
        });

        // Set table status to AVAILABLE
        if (session.tableId) {
            await prisma.table.update({
                where: { id: session.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        // Fire-and-forget relay, audit & socket agar response cepat
        if (session.table) {
            RelayService.sendCommand(session.table.relayChannel, 'off').catch(e => console.error('Relay error:', e));
        }
        AuditService.log(userId, 'SESSION_END', 'Session', { sessionId, tableAmount }).catch(() => { });
        emitSocket('session:end', { sessionId, tableId: session.tableId, status: 'FINISHED' });
        if (session.tableId) emitSocket('table:update', { tableId: session.tableId, status: 'AVAILABLE' });

        if (session.memberId) {
            const playedMs = endTime.getTime() - session.startTime.getTime();
            const hoursPlayed = playedMs / (1000 * 60 * 60);
            await MemberService.updatePlayHours(session.memberId, hoursPlayed);
        }

        return updatedSession;
    }

    static async setPending(sessionId: string, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'FINISHED') throw new AppError('Session must be FINISHED to be set PENDING', 400);

        await prisma.session.update({
            where: { id: sessionId },
            data: { status: 'PENDING' }
        });

        await AuditService.log(userId, 'SESSION_PENDING', 'Session', { sessionId });
        return { success: true };
    }

    static async paySession(sessionId: string, method: string, userId: string, discount: number = 0, receivedAmount: number = 0, taxAmount: number = 0, serviceAmount: number = 0) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true }
        });

        if (!session || !['FINISHED', 'PENDING'].includes(session.status)) {
            throw new AppError('Invalid session for payment', 400);
        }

        const subtotal = session.tableAmount + session.fnbAmount;
        const totalWithCharges = subtotal + (taxAmount || 0) + (serviceAmount || 0);
        const finalAmount = Math.max(0, totalWithCharges - discount);
        const change = receivedAmount > finalAmount ? receivedAmount - finalAmount : 0;

        const memberId = session.memberId;
        const result = await prisma.$transaction(async (tx) => {
            // Cek shift aktif untuk kasir ini
            const activeShift = await tx.cashierShift.findFirst({
                where: { userId, status: 'OPEN' }
            });

            const payment = await tx.payment.create({
                data: {
                    sessionId,
                    amount: finalAmount,
                    discount: discount,
                    received: receivedAmount,
                    change: change,
                    method,
                    status: 'SUCCESS',
                    cashierId: userId,
                    shiftId: activeShift ? activeShift.id : null
                }
            });

            await tx.session.update({
                where: { id: sessionId },
                data: {
                    status: 'PAID',
                    taxAmount: taxAmount || 0,
                    serviceAmount: serviceAmount || 0,
                    totalAmount: totalWithCharges,
                    paymentMethod: method // store method on session too
                } as any
            });

            // INTEGRATE NEW LOYALTY SYSTEM
            if (memberId && finalAmount > 0) {
                try {
                    const { LoyaltyService } = await import('../loyalty/loyalty.service');

                    // Award points for Table & FNB
                    if (session.tableAmount > 0 && session.memberId) {
                        await LoyaltyService.awardGamePoints(sessionId, session.memberId, session.tableAmount);
                    }
                    if (session.fnbAmount > 0 && session.memberId) {
                        await LoyaltyService.awardFnbPoints(session.memberId, session.fnbAmount, sessionId);
                    }

                    // Update Total Spend for Tiering
                    await MemberService.updateSpend(memberId, finalAmount);

                    // Update Streak
                    if (session.memberId) {
                        await LoyaltyService.checkAndUpdateStreak(session.memberId);
                    }
                } catch (e) {
                    console.error('Loyalty award error:', e);
                    // We don't want to fail the whole payment if loyalty system has an issue
                }
            }

            return payment;
        });

        await AuditService.log(userId, 'SESSION_PAYMENT', 'Payment', { sessionId, paymentId: result.id });
        emitSocket('session:paid', { sessionId, paymentId: result.id, amount: result.amount });

        // WA NOTIFICATION RECEIPT
        if (memberId) {
            try {
                const venue = await prisma.venue.findFirst();
                const venueName = venue?.name || 'VAMOS';
                const member = await prisma.member.findUnique({ where: { id: memberId } });
                if (member && member.phone) {
                    const { WaTemplateService, WA_TEMPLATE_IDS } = await import('../whatsapp/wa.template.service');
                    const waTemplate = await WaTemplateService.renderTemplate(WA_TEMPLATE_IDS.PAYMENT_RECEIPT, {
                        name: member.name,
                        venue: venueName,
                        table: session.table?.name || 'VAMOS',
                        amount: finalAmount.toLocaleString('id-ID'),
                    });
                    if (waTemplate) {
                        import('../whatsapp/wa.service').then(({ waService }) => {
                            waService.sendMessage(member.phone as string, waTemplate.body, waTemplate.imageUrl || undefined);
                        });
                    }

                }
            } catch (error) {
                console.error('Failed to send WA receipt:', error);
            }
        }


        return result;
    }

    static async payAsDebt(sessionId: string, userId: string, discount: number = 0, taxAmount: number = 0, serviceAmount: number = 0) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true, orders: { include: { product: true } }, member: true }
        });

        if (!session || !['FINISHED', 'PENDING'].includes(session.status)) {
            throw new AppError('Invalid session for debt payment', 400);
        }

        if (!session.memberId) {
            throw new AppError('Hanya member yang bisa melakukan pembayaran piutang (BON)!', 400);
        }

        const subtotal = session.tableAmount + session.fnbAmount;
        const totalWithCharges = subtotal + (taxAmount || 0) + (serviceAmount || 0);
        const finalAmount = Math.max(0, totalWithCharges - discount);

        // Record the debt in Expense table
        const fnbDetails = (session.orders && session.orders.length > 0) 
            ? session.orders.map(o => `${o.product.name} x${o.quantity}`).join(', ') 
            : 'No FnB';
        const description = `Piutang (BON) - ${session.member?.name}. Sesi: ${session.table?.name || 'FNB Only'}. Detail: ${fnbDetails}`;

        const result = await prisma.$transaction(async (tx) => {
            await tx.session.update({
                where: { id: sessionId },
                data: {
                    status: 'PAID',
                    taxAmount: taxAmount || 0,
                    serviceAmount: serviceAmount || 0,
                    totalAmount: totalWithCharges,
                    paymentMethod: 'BON'
                } as any
            });

            const expense = await tx.expense.create({
                data: {
                    category: 'DEBT',
                    amount: finalAmount,
                    description,
                    isDebt: true,
                    status: 'PENDING',
                    memberId: session.memberId,
                    sessionId: session.id,
                    date: new Date()
                }
            });

            // AWARD LOYALTY POINTS FOR DEBT PAYMENT
            if (session.memberId && finalAmount > 0) {
                try {
                    const { LoyaltyService } = await import('../loyalty/loyalty.service');

                    // Award points for Table & FNB (1 per 1000)
                    if (session.tableAmount > 0) {
                        await LoyaltyService.awardGamePoints(sessionId, session.memberId, session.tableAmount);
                    }
                    if (session.fnbAmount > 0) {
                        await LoyaltyService.awardFnbPoints(session.memberId, session.fnbAmount, sessionId);
                    }

                    // Update Total Spend for Tiering
                    await MemberService.updateSpend(session.memberId, finalAmount);

                    // Update Streak
                    await LoyaltyService.checkAndUpdateStreak(session.memberId);
                } catch (e) {
                    console.error('Loyalty award error (Debt):', e);
                }
            }

            return expense;
        });

        AuditService.log(userId, 'SESSION_DEBT_PAYMENT', 'Expense', { sessionId, expenseId: result.id });
        emitSocket('session:paid', { sessionId, amount: finalAmount, method: 'BON' });
        
        return result;
    }

    static remapSession(s: any) {
        if (!s) return null;
        return {
            ...s,
            startTime: s.startTime || s.starttime,
            endTime: s.endTime || s.endtime,
            durationOpts: s.durationOpts || s.durationopts,
            tableAmount: s.tableAmount || s.tableamount,
            fnbAmount: s.fnbAmount || s.fnbamount,
            taxAmount: s.taxAmount || s.taxamount,
            serviceAmount: s.serviceAmount || s.serviceamount,
            totalAmount: s.totalAmount || s.totalamount,
            memberId: s.memberId || s.memberid,
            customerName: s.customerName || s.customername,
            createdAt: s.createdAt || s.createdat,
            updatedAt: s.updatedAt || s.updatedat,
            deletedAt: s.deletedAt || s.deletedat,
            paymentMethod: s.paymentMethod || s.paymentmethod,
            fnbIncluded: s.fnbIncluded || s.fnbincluded,
            cashierId: s.cashierId || s.cashierid,
            tableId: s.tableId || s.tableid,
        };
    }

    static async getActiveSessions() {
        // === FIX N+1 QUERY: Ambil semua data dalam 2 query, bukan 1+N ===
        // Query 1: Ambil semua sesi aktif beserta tabel, venue, dan member
        const sessions: any[] = await (prisma as any).$queryRawUnsafe(`
            SELECT s.*, 
            t.name as "tableName", t.type as "tableType", t."relayChannel", t."venueId",
            v."taxPercent", v."servicePercent",
            m.name as "memberName"
            FROM "Session" s
            LEFT JOIN "Table" t ON s."tableId" = t.id
            LEFT JOIN "Venue" v ON t."venueId" = v.id
            LEFT JOIN "Member" m ON s."memberId" = m.id
            WHERE s.status = 'ACTIVE'
        `);

        if (sessions.length === 0) return [];

        // Query 2: Ambil SEMUA orders sekaligus untuk semua sesi aktif (bukan per sesi)
        const sessionIds = sessions.map(s => s.id);
        const allOrders = await prisma.order.findMany({
            where: { sessionId: { in: sessionIds } },
            include: { product: true }
        });

        // Group orders by sessionId di memori — O(n) bukan O(n * queries)
        const ordersBySession = new Map<string, typeof allOrders>();
        for (const order of allOrders) {
            if (!ordersBySession.has(order.sessionId)) {
                ordersBySession.set(order.sessionId, []);
            }
            ordersBySession.get(order.sessionId)!.push(order);
        }

        return sessions.map(s => {
            const session = this.remapSession(s);
            return {
                ...session,
                memberName: s.memberName || null,
                table: session.tableId ? {
                    id: session.tableId,
                    name: s.tableName,
                    type: s.tableType,
                    relayChannel: s.relayChannel,
                    venue: { id: s.venueId, taxPercent: s.taxPercent, servicePercent: s.servicePercent }
                } : null,
                orders: ordersBySession.get(s.id) || []
            };
        });
    }

    static async getPendingSessions() {
        return prisma.session.findMany({
            where: { status: { in: ['FINISHED', 'PENDING'] } },
            include: {
                table: { include: { venue: true } },
                member: true,
                orders: { include: { product: true } }
            }
        });
    }

    static async createFnbSession(userId: string, memberId?: string, customerName?: string) {
        const session = await prisma.session.create({
            data: {
                status: 'PENDING',
                memberId: memberId || null,
                customerName: customerName || null,
            } as any
        });

        await AuditService.log(userId, 'SESSION_FNB_START', 'Session', { sessionId: session.id, customerName });
        return session;
    }

    /**
     * Otomatis mematikan sesi yang sudah habis durasinya (prepaid/package).
     * Dijalankan berkala dari server.ts.
     */
    static async checkExpiredSessions() {
        const activeSessions = await prisma.session.findMany({
            where: { status: 'ACTIVE', durationOpts: { not: null, gt: 0 } },
            include: { table: true }
        });

        const expired: string[] = [];
        const now = new Date();

        for (const s of activeSessions) {
            const durationMs = (s.durationOpts || 0) * 60000;
            const limitTime = new Date(s.startTime.getTime() + durationMs);

            if (now >= limitTime) {
                try {
                    // System-id (null atau dedicated id) mengakhiri sesi
                    await this.endSession(s.id, 'SYSTEM');
                    expired.push(s.table?.name || s.id);
                } catch (err: any) {
                    logger.error(`[Auto-Expire] Gagal mengakhiri sesi ${s.id}: ${err.message}`);
                }
            }
        }

        if (expired.length > 0) {
            logger.info(`[Auto-Expire] ${expired.length} sesi berakhir otomatis: [${expired.join(', ')}]`);
        }
        return expired.length;
    }
}
