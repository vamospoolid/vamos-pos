import axios from 'axios';
import { prisma } from '../../database/db';

export class SyncService {
    // Jalankan setiap 15 detik untuk simulasi/real
    static startBackgroundSync() {
        setInterval(async () => {
            try {
                await this.syncPendingData();
            } catch (err) {
                // Jangan throw, biarkan jalan lagi di siklus berikutnya
                console.error('[Sync Worker] Background sync error:', err instanceof Error ? err.message : String(err));
            }
        }, 15000); // 15 seconds
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

        const users = await prisma.user.findMany({ where: { deletedAt: null } });

        const payload = {
            users,
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
        const { users = [], shifts = [], members = [], sessions = [], orders = [], payments = [], expenses = [], waitlists = [] } = payload;
        
        let upsertedCount = 0;

        // Kami melakukan eksekusi secara berurutan agar foreign key constraints terpenuhi
        // Urutan krusial: shifts -> members -> sessions -> orders -> payments -> expenses -> waitlists

        // Helper untuk upsert berulang
        const runUpsert = async (modelDelegate: any, items: any[]) => {
            for (const item of items) {
                const dataToSave = { ...item };
                
                // User model: match by email. Other models: match by ID.
                const isUser = dataToSave.email !== undefined;
                if (isUser) {
                    delete dataToSave.syncStatus;
                    await modelDelegate.upsert({
                        where: { email: item.email },
                        create: dataToSave,
                        update: dataToSave
                    });
                } else {
                    dataToSave.syncStatus = 'SYNCED';
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
