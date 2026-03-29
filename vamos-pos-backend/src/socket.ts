import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { io as ioClient } from 'socket.io-client';
import { logger } from './utils/logger';
import { prisma } from './database/db';
import { eventBus } from './utils/eventBus';

let io: Server;
let latestBridgeStatus: any = null;
let lastCloudError: string | null = null;

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

        // Jika ada status bridge yang tersimpan, kirim ke client yang baru konek (UI)
        if (latestBridgeStatus) {
            socket.emit('bridge:hardware:status', { ...latestBridgeStatus, isBridge: true, isCached: true });
        }

        socket.on('disconnect', () => {
            logger.info(`[Socket.IO Local] Terputus: ${socket.id}`);
        });

        // VPS Broadcaster: Menerima status dari Bridge dan meneruskan ke UI
        socket.on('bridge:status:update', (data: any) => {
            // Simpan ke memori VPS agar client baru bisa dapat status lama
            latestBridgeStatus = data;
            // Teruskan ke semua UI
            io.emit('bridge:hardware:status', { ...data, isBridge: true });
        });
    });

    // Jalankan Jembatan Cloud jika berjalan di mode Lokal (ada Cloud URL di ENV)
    initCloudBridge();

    return io;
};

let cloudSocketInstance: any = null;

/**
 * JEMBATAN CLOUD (Socket Bridge) + LOCAL SYNC
 */
const initCloudBridge = () => {
    // Singleton check: Jangan buat koneksi baru jika sudah ada
    if (cloudSocketInstance) return;

    const cloudUrl = process.env.CLOUD_BASE_URL || 'https://pos.vamospool.id';

    // Jangan connect ke diri sendiri jika sedang berjalan di VPS
    if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
        return;
    }

    logger.info(`🌐 Membangun Jembatan Realtime ke Cloud: ${cloudUrl}`);

    cloudSocketInstance = ioClient(cloudUrl, {
        reconnectionAttempts: Infinity,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,
        timeout: 10000,
    });

    const cloudSocket = cloudSocketInstance;

    cloudSocket.on('connect', () => {
        logger.info('✅ Jembatan Cloud TERHUBUNG! Booking & Tantangan kini Realtime.');
        
        // Laporkan status hardware awal saat terhubung
        import('./modules/relay/relay.service').then(({ RelayService }) => {
            const status = RelayService.getStatus();
            cloudSocket.emit('hardware:status', { isConnected: status.isConnected });
            cloudSocket.emit('bridge:status:update', status);
        });

        // Setup Heartbeat: Kirim status lengkap ke Cloud
        // Gunakan interval yang lebih efisien (30 detik) agar tidak membebani performa
        const heartbeat = setInterval(async () => {
            try {
                if (!cloudSocket.connected) return;
                
                const { RelayService } = await import('./modules/relay/relay.service');
                const status = RelayService.getStatus();
                cloudSocket.emit('bridge:status:update', status);
            } catch (e) {
                // Ignore silent
            }
        }, 30000);

        cloudSocket.once('disconnect', () => clearInterval(heartbeat));
    });

    // Dengarkan perubahan status hardware dari RelayService (via Event Bus)
    eventBus.on('hardware:status', (isConnected: boolean) => {
        if (cloudSocketInstance && cloudSocketInstance.connected) {
            logger.info(`📡 [BRIDGE] Meneruskan Status Hardware ke Cloud: ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
            cloudSocketInstance.emit('hardware:status', { isConnected });
        }
    });

    // Memory untuk debounce (menyimpan waktu terakhir event diterima)
    const eventDebounce = new Map<string, number>();
    const isSpam = (key: string, limit = 1000) => {
        const now = Date.now();
        if (eventDebounce.has(key) && (now - eventDebounce.get(key)! < limit)) return true;
        eventDebounce.set(key, now);
        return false;
    };

    // ── SYNC: Booking baru dari Player App ────────────────────────────────
    cloudSocket.on('booking:new', async (data: any) => {
        if (isSpam(`booking:new-${data?.id}`)) return;
        
        logger.info(`🔔 [SYNC] booking:new diterima dari VPS → menyimpan ke Local DB...`);
        try {
            if (!data || !data.id) return;
            if (data.memberId) await upsertMember(data);

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

        if (io) {
            io.emit('booking:new', data);
            io.emit('waitlist:updated');
        }
    });

    // ── SYNC: Member baru registrasi dari Player App ──────────────────────
    cloudSocket.on('member:new', async (data: any) => {
        if (isSpam(`member:new-${data?.id}`)) return;
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
        if (isSpam(`member:updated-${data?.id}`)) return;
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

    // ── MIRROR ONLY ───────────────────────────────────────────────────────
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
            // Anti-Spam Global: Jeda 5 detik untuk tipe event yang sama (Waitlist, Tournament, dll)
            if (isSpam(`mirror-${event}`, 5000)) return;

            logger.info(`🔔 Cloud Event [${event}] → Teruskan ke UI Lokal...`);
            if (io) io.emit(event, data);
        });
    });

    // ── BRIDGE: Tangkap perintah Relay dari Cloud ─────────────────────────
    cloudSocket.on('relay:command', async (data: any) => {
        // Anti-Spam Khusus Relay: 2 detik
        if (isSpam(`relay-${data.channel}-${data.status}`, 2000)) return;

        logger.info(`🔌 [BRIDGE] relay:command diterima dari VPS: Meja ${data.channel} -> ${data.status}`);
        try {
            const { RelayService } = await import('./modules/relay/relay.service');
            await RelayService.sendCommand(data.channel, data.status);
        } catch (err: any) {
            logger.error(`❌ [BRIDGE] Gagal eksekusi relay hardware: ${err.message}`);
        }
    });

    cloudSocket.on('disconnect', () => {
        logger.warn('⚠️ Jembatan Cloud TERPUTUS. Menunggu koneksi kembali...');
    });

    cloudSocket.on('connect_error', (err: any) => {
        logger.error(`❌ Gagal terhubung ke Jembatan Cloud: ${err.message}`);
        lastCloudError = err.message;
    });
};

/**
 * Helper: Ambil Error Cloud Terakhir
 */
export const getLastCloudError = () => lastCloudError;

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

export const getCloudSocket = () => cloudSocketInstance;
