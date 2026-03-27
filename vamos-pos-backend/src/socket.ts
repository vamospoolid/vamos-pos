import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { io as ioClient } from 'socket.io-client';
import { logger } from './utils/logger';
import { prisma } from './database/db';

let io: Server;

/**
 * Inisialisasi Socket Server lokal (untuk UI kasir dan printer)
 */
export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
    });

    io.on('connection', (socket) => {
        logger.info(`[Socket.IO Local] Terhubung: ${socket.id}`);
        socket.on('disconnect', () => {
            logger.info(`[Socket.IO Local] Terputus: ${socket.id}`);
        });
    });

    // Jalankan Jembatan Cloud jika berjalan di mode Lokal (ada Cloud URL di ENV)
    initCloudBridge();

    return io;
};

/**
 * JEMBATAN CLOUD (Socket Bridge) + LOCAL SYNC
 * 
 * Menghubungkan POS Lokal ke Socket Server di VPS agar booking/tantangan
 * dari aplikasi Player bisa masuk secara REALTIME ke Kasir Windows.
 * 
 * Setiap event yang datang dari VPS juga langsung disimpan ke Local PostgreSQL
 * agar kasir baca dari DB lokal (cepat, tanpa latency VPS).
 */
const initCloudBridge = () => {
    const cloudUrl = process.env.CLOUD_BASE_URL || 'https://pos.vamospool.id';

    // Jangan connect ke diri sendiri jika sedang berjalan di VPS
    if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
        return;
    }

    logger.info(`🌐 Membangun Jembatan Realtime ke Cloud: ${cloudUrl}`);

    const cloudSocket = ioClient(cloudUrl, {
        reconnectionAttempts: Infinity,      // coba terus sampai berhasil
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,         // max 30 detik per percobaan
        timeout: 10000,
    });

    cloudSocket.on('connect', () => {
        logger.info('✅ Jembatan Cloud TERHUBUNG! Booking & Tantangan kini Realtime.');
    });

    // ── SYNC: Booking baru dari Player App ────────────────────────────────
    cloudSocket.on('booking:new', async (data: any) => {
        logger.info(`🔔 [SYNC] booking:new diterima dari VPS → menyimpan ke Local DB...`);
        try {
            if (!data || !data.id) {
                logger.warn('[SYNC] booking:new: data tidak valid, skip.');
                return;
            }

            // Pastikan member lokal ada — sync member dulu jika perlu
            if (data.memberId) {
                await upsertMember(data);
            }

            // Upsert booking ke Local Waitlist
            await (prisma as any).waitlist.upsert({
                where: { id: data.id },
                update: {
                    status: data.status || 'WAITING',
                    reservedTime: data.reservedTime ? new Date(data.reservedTime) : null,
                    updatedAt: new Date(),
                    syncStatus: 'SYNCED',
                },
                create: {
                    id: data.id,
                    customerName: data.customerName || data.memberName || 'Guest',
                    phone: data.phone || data.memberPhone || null,
                    memberId: data.memberId || null,
                    tableId: data.tableId || null,
                    tableType: data.tableType || 'REGULAR',
                    packageId: data.packageId || null,
                    reservedTime: data.reservedTime ? new Date(data.reservedTime) : new Date(),
                    durationMinutes: data.durationMinutes || 60,
                    partySize: data.partySize || 1,
                    notes: data.notes || 'Booked via Player App [SYNCED]',
                    price: data.price || 0,
                    pointsCost: data.pointsCost || 0,
                    status: data.status || 'WAITING',
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: new Date(),
                    syncStatus: 'SYNCED',
                }
            });

            logger.info(`✅ [SYNC] Booking ${data.id} tersimpan di Local DB.`);
        } catch (err: any) {
            logger.error(`❌ [SYNC] Gagal simpan booking: ${err.message}`);
        }

        // Teruskan ke UI kasir
        if (io) {
            io.emit('booking:new', data);
            io.emit('waitlist:updated');
        }
    });

    // ── SYNC: Member baru registrasi dari Player App ──────────────────────
    cloudSocket.on('member:new', async (data: any) => {
        logger.info(`🔔 [SYNC] member:new → menyimpan ke Local DB...`);
        try {
            if (data?.id) await upsertMember(data);
        } catch (err: any) {
            logger.error(`❌ [SYNC] Gagal sync member baru: ${err.message}`);
        }
        if (io) io.emit('member:new', data);
    });

    // ── SYNC: Update profil member ────────────────────────────────────────
    cloudSocket.on('member:updated', async (data: any) => {
        logger.info(`🔔 [SYNC] member:updated → update Local DB...`);
        try {
            if (data?.id) {
                await prisma.member.updateMany({
                    where: { id: data.id },
                    data: {
                        photo: data.photo ?? undefined,
                        loyaltyPoints: data.loyaltyPoints ?? undefined,
                        tier: data.tier ?? undefined,
                        totalWins: data.totalWins ?? undefined,
                        totalMatches: data.totalMatches ?? undefined,
                        experience: data.experience ?? undefined,
                        level: data.level ?? undefined,
                        skillRating: data.skillRating ?? undefined,
                        updatedAt: new Date(),
                        syncStatus: 'SYNCED',
                    }
                });
                logger.info(`✅ [SYNC] Member ${data.id} diupdate di Local DB.`);
            }
        } catch (err: any) {
            logger.error(`❌ [SYNC] Gagal update member: ${err.message}`);
        }
        if (io) io.emit('member:updated', data);
    });

    // ── MIRROR ONLY (Tidak perlu simpan ke DB) ────────────────────────────
    // Events ini cukup diteruskan ke UI, tidak perlu disimpan
    const eventsToMirror = [
        'booking:updated',
        'challenge:new',
        'king:updated',
        'tournament:update',
        'system:message',
        'waitlist:updated',
    ];

    eventsToMirror.forEach(event => {
        cloudSocket.on(event, (data: any) => {
            logger.info(`🔔 Cloud Event [${event}] → Teruskan ke UI Lokal...`);
            if (io) io.emit(event, data);
        });
    });

    cloudSocket.on('disconnect', () => {
        logger.warn('⚠️ Jembatan Cloud TERPUTUS. Menunggu koneksi kembali...');
    });

    cloudSocket.on('connect_error', (err) => {
        logger.error(`❌ Gagal terhubung ke Jembatan Cloud: ${err.message}`);
    });
};

/**
 * Helper: Upsert member ke Local DB (skip jika phone conflict dengan member berbeda)
 */
async function upsertMember(data: any) {
    if (!data?.id) return;

    // Cek apakah sudah ada member dengan phone yang sama tapi ID berbeda
    if (data.phone) {
        const existing = await prisma.member.findFirst({
            where: { phone: data.phone, NOT: { id: data.id } }
        });
        if (existing) {
            // Phone sudah dipakai member lain — jangan timpa, hanya update yang relevan
            logger.warn(`[SYNC] Phone ${data.phone} sudah ada (member lain). Skip upsert.`);
            return;
        }
    }

    await (prisma.member as any).upsert({
        where: { id: data.id },
        update: {
            name: data.name || data.memberName,
            photo: data.photo || data.memberPhoto || undefined,
            tier: data.tier || data.memberTier || undefined,
            loyaltyPoints: data.loyaltyPoints ?? undefined,
            updatedAt: new Date(),
            syncStatus: 'SYNCED',
        },
        create: {
            id: data.id,
            name: data.name || data.memberName || 'Player',
            phone: data.phone || data.memberPhone || `player_${data.id.slice(0, 8)}`,
            email: data.email || null,
            tier: data.tier || data.memberTier || 'BRONZE',
            loyaltyPoints: data.loyaltyPoints || 0,
            photo: data.photo || data.memberPhoto || null,
            handicap: data.handicap || '4',
            handicapLabel: data.handicapLabel || 'Entry Fragger',
            skillRating: data.skillRating || 200,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: new Date(),
            syncStatus: 'SYNCED',
        }
    });
    logger.info(`✅ [SYNC] Member ${data.id} di-upsert ke Local DB.`);
}

export const getIO = () => {
    if (!io) {
        console.warn('Socket.io is not initialized yet!');
    }
    return io;
};
