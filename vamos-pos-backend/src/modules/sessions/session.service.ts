import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { RelayService } from '../relay/relay.service';
import { PricingService } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';
import { MemberService } from '../members/member.service';

export class SessionService {
    static async startSession(tableId: string, userId: string, packageId?: string, memberId?: string, customDurationOpts?: number, overrideAmount?: number) {
        const table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table || table.status !== 'AVAILABLE') {
            throw new AppError('Table is not available', 400);
        }

        let durationOpts = null;
        let tableAmount = 0;

        let fnbIncluded = null;

        if (packageId) {
            const pkg = await prisma.package.findUnique({ where: { id: packageId } });
            if (!pkg) throw new AppError('Package not found', 404);
            durationOpts = pkg.duration;
            tableAmount = (memberId && pkg.memberPrice) ? pkg.memberPrice : pkg.price;
            fnbIncluded = pkg.fnbItems;
        } else if (customDurationOpts) {
            durationOpts = customDurationOpts;
            const now = new Date();
            const mockEndTime = new Date(now.getTime() + durationOpts * 60000);
            const isMember = !!memberId;
            tableAmount = await PricingService.calculateTableAmount(table.type, now, mockEndTime, isMember);
        }

        // Apply authorized points cost from booking if provided
        if (overrideAmount !== undefined) {
            tableAmount = overrideAmount;
        }

        // Run session create + table update in parallel for speed
        const [session] = await Promise.all([
            prisma.session.create({
                data: {
                    tableId,
                    packageId,
                    memberId,
                    durationOpts,
                    tableAmount,
                    fnbIncluded,
                    status: 'ACTIVE',
                    cashierId: userId, // Catat siapa kasir yang membuka meja
                }
            }),
            prisma.table.update({
                where: { id: tableId },
                data: { status: 'PLAYING' }
            })
        ]);

        // Fire-and-forget: jangan await relay & audit agar response cepat
        RelayService.sendCommand(table.relayChannel, 'on').catch(e => console.error('Relay error:', e));
        AuditService.log(userId, 'SESSION_START', 'Session', { sessionId: session.id, tableId }).catch(() => { });

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
            tableAmount = await PricingService.calculateTableAmount(session.table.type, session.startTime, endTime, isMember);
        }

        // Update session with final tableAmount, status, and endTime
        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'FINISHED',
                endTime,
                tableAmount,
                totalAmount: tableAmount + session.fnbAmount,
                taxAmount: 0,
                serviceAmount: 0
            } as any
        });

        // Set table status to AVAILABLE
        if (session.tableId) {
            await prisma.table.update({
                where: { id: session.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        // Fire-and-forget relay & audit
        if (session.tableId && session.table) {
            RelayService.sendCommand(session.table.relayChannel, 'off').catch(e => console.error('Relay error:', e));
        }
        AuditService.log(userId, 'SESSION_END', 'Session', { sessionId, tableAmount }).catch(() => { });

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
            pausedAt: s.pausedAt || s.pausedat,
            totalPausedMs: s.totalPausedMs !== undefined ? Number(s.totalPausedMs) : (s.totalpausedms !== undefined ? Number(s.totalpausedms) : 0),
            cashierId: s.cashierId || s.cashierid,
            tableId: s.tableId || s.tableid,
        };
    }

    static async getActiveSessions() {
        // Using raw SQL to bypass Prisma generation (EPERM issue)
        const sessions: any[] = await (prisma as any).$queryRawUnsafe(`
            SELECT s.*, 
            t.name as "tableName", t.type as "tableType", t."relayChannel", t."venueId",
            v."taxPercent", v."servicePercent"
            FROM "Session" s
            LEFT JOIN "Table" t ON s."tableId" = t.id
            LEFT JOIN "Venue" v ON t."venueId" = v.id
            WHERE s.status = 'ACTIVE'
        `);

        // We need to re-structure the raw data to match Prisma's nested format that the frontend expects
        const sessionsWithDetails = await Promise.all(sessions.map(async (s) => {
            const orders = await prisma.order.findMany({
                where: { sessionId: s.id },
                include: { product: true }
            });
            const session = this.remapSession(s);
            return {
                ...session,
                table: session.tableId ? {
                    id: session.tableId,
                    name: s.tableName,
                    type: s.tableType,
                    relayChannel: s.relayChannel,
                    venue: { id: s.venueId, taxPercent: s.taxPercent, servicePercent: s.servicePercent }
                } : null,
                orders
            };
        }));
        return sessionsWithDetails;
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
     * Pause timer only — relay/lamp stays ON.
     * Records the moment pause started.
     */
    static async pauseSession(sessionId: string, userId: string) {
        const sessionArr: any[] = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "Session" WHERE id = $1`, sessionId);
        const session = this.remapSession(sessionArr[0]);
        if (!session || session.status !== 'ACTIVE') throw new AppError('Session not active', 400);
        if (session.pausedAt) throw new AppError('Session already paused', 400);

        // Using raw SQL to bypass Prisma generation (EPERM issue)
        await (prisma as any).$executeRawUnsafe(`UPDATE "Session" SET "pausedAt" = $1 WHERE id = $2`, new Date(), sessionId);
        const updatedArr: any[] = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "Session" WHERE id = $1`, sessionId);
        const updated = this.remapSession(updatedArr[0]);

        AuditService.log(userId, 'SESSION_PAUSE', 'Session', { sessionId }).catch(() => { });
        return updated;
    }

    /**
     * Resume timer — accumulates elapsed pause duration into totalPausedMs.
     * Relay/lamp is untouched.
     */
    static async resumeSession(sessionId: string, userId: string) {
        const sessionArr: any[] = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "Session" WHERE id = $1`, sessionId);
        const session = this.remapSession(sessionArr[0]);
        if (!session || session.status !== 'ACTIVE') throw new AppError('Session not active', 400);
        if (!session.pausedAt) throw new AppError('Session is not paused', 400);

        const pausedAt = new Date(session.pausedAt);
        const additionalPausedMs = Date.now() - pausedAt.getTime();
        const newTotalPausedMs = (Number(session.totalPausedMs) || 0) + additionalPausedMs;

        // Using raw SQL to bypass Prisma generation (EPERM issue)
        await (prisma as any).$executeRawUnsafe(`UPDATE "Session" SET "pausedAt" = NULL, "totalPausedMs" = $1 WHERE id = $2`, newTotalPausedMs, sessionId);
        const updatedArr: any[] = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "Session" WHERE id = $1`, sessionId);
        const updated = this.remapSession(updatedArr[0]);

        AuditService.log(userId, 'SESSION_RESUME', 'Session', { sessionId, pausedMs: additionalPausedMs }).catch(() => { });
        return updated;
    }
}
