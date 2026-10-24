import axios from 'axios';
import { prisma } from '../../database/db';
import { logger } from '../../utils/logger';

// ── Sync constants ──────────────────────────────────────────────────────────
const SYNC_BATCH_SIZE = 50;       // Fix #1: max items per batch to avoid timeout
const SYNC_TIMEOUT_MS = 60000;    // Fix #1: 60s HTTP timeout (up from 10s)
const TX_TIMEOUT_MS   = 60000;    // Fix #1: 60s Prisma transaction timeout

export class SyncService {
    // In-memory anti-spam cache for WhatsApp welcome notifications
    private static notifiedMemberPhones = new Set<string>();
    private static isInitialized = false;

    // Jalankan worker yang memantau pengaturan sinkronisasi
    static startBackgroundSync() {
        const isLocal = process.env.IS_LOCAL_ELECTRON === 'true';
        if (!isLocal) {
            logger.info('☁️ Cloud server detected: Outbound sync worker is disabled on VPS.');
            return;
        }

        const runSyncCycle = async () => {
            try {
                const venue: any = await prisma.venue.findFirst();
                if (venue?.isSyncEnabled) {
                    await this.syncPendingData();
                }
                const interval = (venue?.syncIntervalSeconds || 30) * 1000;
                setTimeout(runSyncCycle, interval);
            } catch (err) {
                console.error('[Sync Worker] Cycle error:', err instanceof Error ? err.message : String(err));
                setTimeout(runSyncCycle, 30000);
            }
        };
        runSyncCycle();
    }

    // ── Fix #3: Only sync venue when config has changed ──────────────────────
    private static lastVenueHash: string = '';
    private static hashVenue(venue: any): string {
        if (!venue) return '';
        const { name, address, openTime, closeTime, servicePercent, taxPercent,
                isSyncEnabled, syncIntervalSeconds, phone, isRecipeSystemEnabled } = venue;
        return JSON.stringify({ name, address, openTime, closeTime, servicePercent,
                                taxPercent, isSyncEnabled, syncIntervalSeconds, phone, isRecipeSystemEnabled });
    }

    static async syncPendingData() {
        const vpsUrl     = process.env.VPS_SYNC_URL  || 'https://pos.vamospool.id';
        const syncSecret = process.env.SYNC_SECRET   || 'sync_secret_key';

        // 1. Fetch PENDING data – fix #1: sliced to SYNC_BATCH_SIZE each
        const shifts   = await prisma.cashierShift.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });
        const members  = await prisma.member.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });
        const sessions = await prisma.session.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });
        const orders   = await prisma.order.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });
        const payments = await prisma.payment.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });
        const expenses = await prisma.expense.findMany({ where: { syncStatus: 'PENDING' }, take: SYNC_BATCH_SIZE });

        // Fix #5: Only sync today's waitlists – historical ones are not useful on VPS
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const waitlists = await prisma.waitlist.findMany({
            where: { syncStatus: 'PENDING', createdAt: { gte: todayStart } },
            take: SYNC_BATCH_SIZE
        });

        // Users always included (needed as FK for shifts/sessions)
        const users = await prisma.user.findMany({ where: { deletedAt: null } });

        // Fix #3: Only send venue if it has actually changed
        const rawVenue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        const currentHash = this.hashVenue(rawVenue);
        const venueChanged = currentHash !== this.lastVenueHash;
        const venues = venueChanged && rawVenue ? [rawVenue] : [];

        // Fix #2: Validate orders – filter out those whose productId doesn't exist locally
        // (if product was deleted on one side, the FK would fail on VPS)
        const validProductIds = new Set(
            (await prisma.product.findMany({ select: { id: true } })).map(p => p.id)
        );
        const safeOrders = orders.filter(o => validProductIds.has(o.productId));
        const skippedOrders = orders.length - safeOrders.length;
        if (skippedOrders > 0) {
            logger.warn(`[Sync Worker] ⚠️ Skipped ${skippedOrders} orders with unknown productId (FK safety).`);
        }

        const payload = { users, venues, shifts, members, sessions,
                          orders: safeOrders, payments, expenses, waitlists };

        const totalItems = Object.values(payload).reduce((acc, curr) => acc + curr.length, 0);
        if (totalItems === 0) return 0;

        logger.info(`[Sync Worker] 🚀 Syncing ${totalItems} items → ${vpsUrl} (batch ≤${SYNC_BATCH_SIZE})`);

        try {
            // 2. POST to VPS
            const res = await axios.post(`${vpsUrl}/api/system/sync/receive`, payload, {
                headers: { 'Content-Type': 'application/json', 'x-sync-secret': syncSecret },
                timeout: SYNC_TIMEOUT_MS
            });

            if (res.status === 200) {
                // 3. Mark as SYNCED on success
                await prisma.$transaction([
                    prisma.cashierShift.updateMany({ where: { id: { in: shifts.map(s => s.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.member.updateMany({ where: { id: { in: members.map(m => m.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.session.updateMany({ where: { id: { in: sessions.map(s => s.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.order.updateMany({ where: { id: { in: safeOrders.map(o => o.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.payment.updateMany({ where: { id: { in: payments.map(p => p.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.expense.updateMany({ where: { id: { in: expenses.map(e => e.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.waitlist.updateMany({ where: { id: { in: waitlists.map(w => w.id) } }, data: { syncStatus: 'SYNCED' } }),
                ]);

                // Fix #3: Remember venue hash after successful sync
                if (venueChanged) this.lastVenueHash = currentHash;

                logger.info(`[Sync Worker] ✅ Synced ${totalItems} items to VPS successfully!`);
                return totalItems;
            }
        } catch (err: any) {
            const detail = err?.response?.data || err.message;
            logger.error(`[Sync Worker] ❌ Failed to send to VPS: ${JSON.stringify(detail)}`);
            throw err;
        }
        return 0;
    }

    static async getUnsyncedCount() {
        const isLocal = process.env.IS_LOCAL_ELECTRON === 'true';
        if (!isLocal) {
            // Outbound sync only applies to local clients. VPS Cloud is the sync destination.
            return 0;
        }

        const [c1, c2, c3, c4, c5, c6, c7] = await Promise.all([
            prisma.cashierShift.count({ where: { syncStatus: 'PENDING' } }),
            prisma.member.count({ where: { syncStatus: 'PENDING' } }),
            prisma.session.count({ where: { syncStatus: 'PENDING' } }),
            prisma.order.count({ where: { syncStatus: 'PENDING' } }),
            prisma.payment.count({ where: { syncStatus: 'PENDING' } }),
            prisma.expense.count({ where: { syncStatus: 'PENDING' } }),
            prisma.waitlist.count({ where: { syncStatus: 'PENDING' } })
        ]);
        return c1 + c2 + c3 + c4 + c5 + c6 + c7;
    }

    /**
     * Inisialisasi daftar nomor telepon member yang sudah ada agar tidak pernah terkirim pesan selamat bergabung berulang
     */
    private static async ensureInitialized() {
        if (SyncService.isInitialized) return;
        try {
            const existing = await prisma.member.findMany({ select: { phone: true } });
            for (const m of existing) {
                if (m.phone) SyncService.notifiedMemberPhones.add(m.phone.trim());
            }
            SyncService.isInitialized = true;
        } catch (e) {
            // Ignore error if table not ready
        }
    }

    /**
     * Dipanggil oleh VPS Cloud ketika Local Backend menembak data ke `/api/sync/receive`
     */
    static async receiveSyncPayload(payload: any) {
        await SyncService.ensureInitialized();

        const {
            users    = [],
            venues   = [],
            shifts   = [],
            members  = [],
            sessions = [],
            orders   = [],
            payments = [],
            expenses = [],
            waitlists = []
        } = payload;

        let upsertedCount = 0;
        const isLocal = process.env.IS_LOCAL_ELECTRON === 'true';

        // ── Pre-fetch valid Foreign Keys on destination DB to prevent constraint crashes ──
        const [allProducts, allTables, allUsers, allPackages] = await Promise.all([
            prisma.product.findMany({ select: { id: true } }),
            prisma.table.findMany({ select: { id: true, name: true } }),
            prisma.user.findMany({ select: { id: true } }),
            prisma.package.findMany({ select: { id: true } })
        ]);

        const validProductIds = new Set(allProducts.map(p => p.id));
        const validTableIds   = new Set(allTables.map(t => t.id));
        const validUserIds    = new Set(allUsers.map(u => u.id));
        const validPackageIds = new Set(allPackages.map(p => p.id));

        // Create table name lookup (e.g. "meja01" -> id, "table01" -> id)
        const tableNameMap = new Map<string, string>();
        for (const t of allTables) {
            const clean = t.name.toLowerCase().replace(/\s+/g, '').replace('table', 'meja');
            tableNameMap.set(clean, t.id);
            tableNameMap.set(t.name.toLowerCase().replace(/\s+/g, ''), t.id);
        }

        const newMembersToNotify: any[] = [];

        // ── Helper: upsert with Last-Write-Wins + FK guard ───────────────────
        const runUpsert = async (modelDelegate: any, items: any[]) => {
            for (const item of items) {
                const dataToSave = { ...item };

                // ── USER branch ──────────────────────────────────────────────
                const isUser = typeof dataToSave.email === 'string' && dataToSave.role !== undefined;
                if (isUser) {
                    delete dataToSave.syncStatus;

                    // Last-Write-Wins: skip if destination is newer
                    const existing = await modelDelegate.findUnique({ where: { email: item.email } });
                    if (existing?.updatedAt && item.updatedAt &&
                        new Date(item.updatedAt) <= new Date(existing.updatedAt)) {
                        upsertedCount++;
                        continue;
                    }

                    await modelDelegate.upsert({
                        where:  { email: item.email },
                        create: dataToSave,
                        update: dataToSave
                    });

                } else {
                    // ── NON-USER branch ──────────────────────────────────────
                    const isVenue   = dataToSave.isSyncEnabled !== undefined && dataToSave.syncIntervalSeconds !== undefined;
                    const isMaster  = dataToSave.relayChannel !== undefined || isVenue;
                    const isMember  = dataToSave.loyaltyPoints !== undefined && dataToSave.tier !== undefined;
                    const isSession = dataToSave.startTime !== undefined && (dataToSave.status !== undefined || dataToSave.tableAmount !== undefined);
                    const isOrder   = dataToSave.productId !== undefined && dataToSave.quantity !== undefined;
                    const isPayment = dataToSave.amount !== undefined && dataToSave.method !== undefined;
                    const isShift   = dataToSave.startingCash !== undefined && dataToSave.shiftNumber !== undefined;

                    // FK Guard 1: Orders (skip if product doesn't exist on this DB)
                    if (isOrder) {
                        if (!validProductIds.has(dataToSave.productId)) {
                            logger.warn(`[SYNC] ⚠️ Skipped Order ${item.id}: productId ${dataToSave.productId} not found.`);
                            upsertedCount++;
                            continue;
                        }
                        delete dataToSave.product;
                        delete dataToSave.session;
                    }

                    // FK Guard 2: Sessions (tableId, packageId, cashierId)
                    if (isSession) {
                        if (dataToSave.tableId && !validTableIds.has(dataToSave.tableId)) {
                            const localName = (dataToSave.table?.name || '').toLowerCase().replace(/\s+/g, '').replace('table', 'meja');
                            const matchedId = tableNameMap.get(localName);
                            if (matchedId) {
                                dataToSave.tableId = matchedId;
                            } else {
                                logger.warn(`[SYNC] ⚠️ Session ${item.id} tableId ${dataToSave.tableId} not found on destination DB. Setting tableId to null to prevent FK violation.`);
                                dataToSave.tableId = null;
                            }
                        }
                        if (dataToSave.packageId && !validPackageIds.has(dataToSave.packageId)) {
                            dataToSave.packageId = null;
                        }
                        if (dataToSave.cashierId && !validUserIds.has(dataToSave.cashierId)) {
                            dataToSave.cashierId = null;
                        }
                        delete dataToSave.table;
                        delete dataToSave.member;
                        delete dataToSave.package;
                        delete dataToSave.cashier;
                        delete dataToSave.orders;
                        delete dataToSave.payments;
                    }

                    // FK Guard 3: Shifts (userId)
                    if (isShift) {
                        if (dataToSave.userId && !validUserIds.has(dataToSave.userId)) {
                            dataToSave.userId = Array.from(validUserIds)[0] || dataToSave.userId;
                        }
                        delete dataToSave.user;
                        delete dataToSave.expenses;
                    }

                    // Cleanup and guard payment foreign keys
                    if (isPayment) {
                        if (dataToSave.cashierId && !validUserIds.has(dataToSave.cashierId)) {
                            dataToSave.cashierId = Array.from(validUserIds)[0] || null;
                        }
                        delete dataToSave.session;
                        delete dataToSave.cashier;
                    }

                    // Guard expense foreign keys
                    const isExpense = dataToSave.amount !== undefined && dataToSave.category !== undefined;
                    if (isExpense) {
                        if (dataToSave.userId && !validUserIds.has(dataToSave.userId)) {
                            dataToSave.userId = Array.from(validUserIds)[0] || dataToSave.userId;
                        }
                        delete dataToSave.user;
                        delete dataToSave.shift;
                    }

                    if (!isMaster) {
                        dataToSave.syncStatus = 'SYNCED';
                    } else {
                        delete dataToSave.syncStatus;
                    }

                    // Fix #3 (receive-side): Don't overwrite hardware fields on local env
                    if (isVenue && isLocal) {
                        delete dataToSave.relayComPort;
                        delete dataToSave.blinkWarningMinutes;
                        delete dataToSave.receiptPrinterPath;
                        delete dataToSave.printerPath;
                        logger.info(`🛡️ [SYNC] Shield active: Protected hardware settings from VPS overwrite.`);
                    }

                    // Fix #1 (LWW): Skip member/venue if destination is newer
                    if (isMember || isVenue) {
                        const existing = await modelDelegate.findUnique({ where: { id: item.id } });
                        if (existing?.updatedAt && item.updatedAt &&
                            new Date(item.updatedAt) <= new Date(existing.updatedAt)) {
                            upsertedCount++;
                            continue;
                        }
                    }

                    // Fix #5 (receive-side): Skip stale waitlists (older than today)
                    const isWaitlist = dataToSave.position !== undefined;
                    if (isWaitlist && dataToSave.createdAt) {
                        const created = new Date(dataToSave.createdAt);
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        if (created < todayStart) {
                            upsertedCount++;
                            continue;
                        }
                    }

                    // Track new member for WA notification
                    const isNewMember = isMember && !isLocal;
                    let existingMember: any = null;
                    if (isNewMember) {
                        existingMember = await modelDelegate.findUnique({ where: { id: item.id } });
                        if (!existingMember && dataToSave.phone) {
                            existingMember = await modelDelegate.findFirst({ where: { phone: dataToSave.phone } });
                        }
                    }

                    await modelDelegate.upsert({
                        where:  { id: item.id },
                        create: dataToSave,
                        update: dataToSave
                    });

                    // Queue WhatsApp welcome ONLY for brand-new member arriving on VPS
                    // Member must be created recently (< 2 hours) and phone must not have been notified
                    if (isNewMember && !existingMember && dataToSave.phone) {
                        const phoneClean = dataToSave.phone.trim();
                        const isRecent = dataToSave.createdAt && (Date.now() - new Date(dataToSave.createdAt).getTime() < 2 * 60 * 60 * 1000);
                        if (isRecent && !SyncService.notifiedMemberPhones.has(phoneClean)) {
                            SyncService.notifiedMemberPhones.add(phoneClean);
                            newMembersToNotify.push(dataToSave);
                        }
                    }
                }
                upsertedCount++;
            }
        };

        // Fix #1: Raised transaction timeout to 60s
        await prisma.$transaction(async (tx) => {
            // Order matters for FK: users → venues → shifts → members → sessions → orders/payments → expenses → waitlists
            await runUpsert(tx.user, users);
            await runUpsert(tx.venue, venues);
            await runUpsert(tx.cashierShift, shifts);
            await runUpsert(tx.member, members);
            await runUpsert(tx.session, sessions);
            await runUpsert(tx.order, orders);
            await runUpsert(tx.payment, payments);
            await runUpsert(tx.expense, expenses);
            await runUpsert(tx.waitlist, waitlists);
        }, { timeout: TX_TIMEOUT_MS });

        // CRITICAL FIX: Trigger WhatsApp welcome ONLY AFTER transaction is successfully committed to database!
        for (const member of newMembersToNotify) {
            this.triggerSyncNotification(member).catch(() => {});
        }

        return upsertedCount;
    }

    /**
     * Helper: Trigger WhatsApp Welcome when a member is synced to the VPS
     */
    static async triggerSyncNotification(memberData: any) {
        try {
            if (!memberData?.phone) return;
            const phone = memberData.phone.trim();

            const { prisma: localPrisma } = await import('../../database/db');
            const venue = await localPrisma.venue.findFirst();
            const venueName = venue?.name || 'VAMOS';

            const { WaTemplateService, WA_TEMPLATE_IDS } = await import('../whatsapp/wa.template.service');
            const waTemplate = await WaTemplateService.renderTemplate(WA_TEMPLATE_IDS.WELCOME_MEMBER, {
                name:  memberData.name,
                venue: venueName,
            });

            if (waTemplate) {
                const { waService } = await import('../whatsapp/wa.service');
                if (waService.isReady) {
                    await waService.sendMessage(phone, waTemplate.body, waTemplate.imageUrl || undefined);
                    logger.info(`✅ [VPS_SYNC_WA] Welcome message sent for synced member: ${memberData.name} (${phone})`);
                }
            }
        } catch (err: any) {
            logger.error(`❌ [VPS_SYNC_WA] Failed: ${err.message}`);
        }
    }
}
