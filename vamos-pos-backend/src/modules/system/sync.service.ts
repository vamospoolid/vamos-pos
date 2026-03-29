import axios from 'axios';
import { prisma } from '../../database/db';

export class SyncService {
    // Jalankan worker yang memantau pengaturan sinkronisasi
    static startBackgroundSync() {
        // Gunakan timeout rekursif agar intervalnya bisa berubah dinamis jika diinginkan
        const runSyncCycle = async () => {
            try {
                const venue: any = await prisma.venue.findFirst();
                if (venue?.isSyncEnabled) {
                    await this.syncPendingData();
                }
                
                // Jadwalkan siklus berikutnya berdasarkan database (default 30 detik)
                const interval = (venue?.syncIntervalSeconds || 30) * 1000;
                setTimeout(runSyncCycle, interval);
            } catch (err) {
                console.error('[Sync Worker] Cycle error:', err instanceof Error ? err.message : String(err));
                // Jika error, coba lagi dalam 30 detik
                setTimeout(runSyncCycle, 30000);
            }
        };

        runSyncCycle();
    }

    static async syncPendingData() {
        const vpsUrl = process.env.VPS_SYNC_URL || 'https://pos.vamospool.id';
        const syncSecret = process.env.SYNC_SECRET || 'sync_secret_key';

        // 1. Ambil data PENDING
        const shifts = await prisma.cashierShift.findMany({ where: { syncStatus: 'PENDING' } });
        const members = await prisma.member.findMany({ where: { syncStatus: 'PENDING' } });
        const sessions = await prisma.session.findMany({ where: { syncStatus: 'PENDING' } });
        const orders = await prisma.order.findMany({ where: { syncStatus: 'PENDING' } });
        const payments = await prisma.payment.findMany({ where: { syncStatus: 'PENDING' } });
        const expenses = await prisma.expense.findMany({ where: { syncStatus: 'PENDING' } });
        const waitlists = await prisma.waitlist.findMany({ where: { syncStatus: 'PENDING' } });

        // CATATAN: tables TIDAK disync dari lokal ke VPS.
        // Status meja (AVAILABLE/PLAYING) dikelola sepenuhnya oleh VPS.
        // Mengirim data tabel lokal akan menimpa status PLAYING di VPS.
        const users = await prisma.user.findMany({ where: { deletedAt: null } });
        const venues = await prisma.venue.findMany({ where: { deletedAt: null } });

        const payload = {
            users,
            venues,
            shifts,
            members,
            sessions,
            orders,
            payments,
            expenses,
            waitlists
        };

        const totalItems = Object.values(payload).reduce((acc, curr) => acc + curr.length, 0);
        if (totalItems === 0) return 0; // Tidak ada yang perlu disinkronisasi

        console.log(`[Sync Worker] Attempting to sync ${totalItems} items to ${vpsUrl} with secret prefix ${syncSecret.substring(0, 3)}...`);

        try {
            // 2. POST ke VPS
            const res = await axios.post(`${vpsUrl}/api/system/sync/receive`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-sync-secret': syncSecret
                },
                timeout: 10000 // 10 detik batas
            });

            if (res.status === 200) {
                // 3. Mark as SYNCED jika sukses
                await prisma.$transaction([
                    prisma.cashierShift.updateMany({ where: { id: { in: shifts.map(s => s.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.member.updateMany({ where: { id: { in: members.map(m => m.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.session.updateMany({ where: { id: { in: sessions.map(s => s.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.order.updateMany({ where: { id: { in: orders.map(o => o.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.payment.updateMany({ where: { id: { in: payments.map(p => p.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.expense.updateMany({ where: { id: { in: expenses.map(e => e.id) } }, data: { syncStatus: 'SYNCED' } }),
                    prisma.waitlist.updateMany({ where: { id: { in: waitlists.map(w => w.id) } }, data: { syncStatus: 'SYNCED' } }),
                ]);

                console.log(`[Sync Worker] Successfully synced ${totalItems} items to VPS!`);
                return totalItems;
            }
        } catch (err: any) {
            console.error('[Sync Worker] Failed to send data to VPS:', err?.response?.data || err.message);
            throw err; // throw agar tertangkap function pemanggil
        }
        return 0;
    }

    static async getUnsyncedCount() {
        // Ambil jumlah count data yang belum sync
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
     * Dipanggil oleh VPS Cloud ketika Local Backend menembak data ke `/api/sync/receive`
     */
    static async receiveSyncPayload(payload: any) {
        const { 
            users = [], 
            venues = [], 
            tables = [], 
            shifts = [], 
            members = [], 
            sessions = [], 
            orders = [], 
            payments = [], 
            expenses = [], 
            waitlists = [] 
        } = payload;
        
        let upsertedCount = 0;

        // Kami melakukan eksekusi secara berurutan agar foreign key constraints terpenuhi
        // Urutan krusial: users/venues -> tables -> members/shifts -> sessions -> orders -> payments -> expenses -> waitlists

        // Helper untuk upsert berulang
        const runUpsert = async (modelDelegate: any, items: any[]) => {
            for (const item of items) {
                const dataToSave = { ...item };
                
                // User model: match by email. Other models: match by ID.
                const isUser = dataToSave.email !== undefined && dataToSave.password !== undefined;
                if (isUser) {
                    delete dataToSave.syncStatus;
                    await modelDelegate.upsert({
                        where: { email: item.email },
                        create: dataToSave,
                        update: dataToSave
                    });
                } else {
                    // Only add syncStatus if it's NOT a master data table (user, venue, table)
                    const isMaster = dataToSave.relayChannel !== undefined || dataToSave.openTime !== undefined || isUser;
                    if (!isMaster) {
                         dataToSave.syncStatus = 'SYNCED';
                    } else {
                         delete dataToSave.syncStatus;
                    }
                    
                    await modelDelegate.upsert({
                        where: { id: item.id },
                        create: dataToSave,
                        update: dataToSave
                    });
                }
                upsertedCount++;
            }
        };

        await prisma.$transaction(async (tx) => {
            await runUpsert(tx.user, users);
            await runUpsert(tx.venue, venues);
            // TIDAK melakukan upsert tables dari lokal — VPS adalah sumber kebenaran untuk status meja
            // await runUpsert(tx.table, tables);
            await runUpsert(tx.cashierShift, shifts);
            await runUpsert(tx.member, members);
            await runUpsert(tx.session, sessions);
            await runUpsert(tx.order, orders);
            await runUpsert(tx.payment, payments);
            await runUpsert(tx.expense, expenses);
            await runUpsert(tx.waitlist, waitlists);
        }, {
             timeout: 20000 // 20 detik waktu maksimum untuk insert massal
        });

        return upsertedCount;
    }
}
