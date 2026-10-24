/**
 * wa.service.ts (Vamos POS — Baileys Edition)
 * 
 * PERBAIKAN ANTI-BLOCK:
 * - Diganti dari whatsapp-web.js (Puppeteer/Chrome emulation) ke @whiskeysockets/baileys
 * - Baileys menggunakan WebSocket native seperti WA Desktop — jauh lebih sulit diblok
 * - Ditambahkan message queue dengan delay acak 1.5–3 detik (anti-spam/anti-ban)
 * - Browser fingerprint disesuaikan: ['VamosPOS', 'Chrome', '124.0.0.0']
 * - Reconnect clean, tidak aggressive
 * 
 * ADOPSI DARI: CodePOS WhatsAppManager.ts
 */

import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    WASocket,
    ConnectionState,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';

class WhatsAppService {
    private sock: WASocket | null = null;
    public isReady: boolean = false;
    public latestQr: string = ''; // base64 data URL PNG
    public isInitializing: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts = 8;
    private isReconnecting = false;

    // Message queue anti-ban: random delay 1.5–3 detik
    private messageQueue: Array<() => Promise<void>> = [];
    private isProcessingQueue = false;

    // Lokasi folder sesi Baileys
    private readonly sessionDir = path.resolve(process.cwd(), 'storage/whatsapp_session');

    constructor() {
        // Pastikan folder storage ada
        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir, { recursive: true });
        }
        // Auto-init saat startup (coba restore sesi lama)
        this.initialize();
    }

    /** Normalisasi nomor HP: 08xxx / 8xxx → 628xxx */
    public normalizePhone(phone?: string): string {
        if (!phone) return '';
        let clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) {
            clean = '62' + clean.slice(1);
        } else if (clean.startsWith('8')) {
            clean = '62' + clean;
        }
        return clean;
    }

    /** Emit status via Socket.IO ke frontend */
    private async emitStatus() {
        try {
            const { getIO } = await import('../../socket');
            const io = getIO();
            if (io) {
                io.emit('whatsapp:status', {
                    isReady: this.isReady,
                    isInitializing: this.isInitializing,
                    hasQr: !!this.latestQr
                });
            }
        } catch (e) { /* skip jika socket belum init */ }
    }

    /** Inisialisasi koneksi Baileys */
    public async initialize(): Promise<void> {
        if (this.isInitializing) return;
        this.isInitializing = true;
        this.emitStatus();

        logger.info('⏳ [WHATSAPP] Menginisialisasi Baileys engine...');

        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
            const { version } = await fetchLatestBaileysVersion();

            // Pino logger — set warn agar tidak banjir log
            const pinoLogger = pino({ level: 'warn' });

            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pinoLogger,
                printQRInTerminal: false,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
                // Browser fingerprint: menyamar sebagai WhatsApp Desktop
                // Ini kunci anti-block — jangan pakai Chromium/Puppeteer
                browser: ['VamosPOS', 'Chrome', '124.0.0.0'],
                // Nonaktifkan fitur yang tidak perlu (lebih ringan & anti-ban)
                getMessage: async () => undefined,
            });

            // Simpan credentials setiap update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection state changes
            this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    // QR baru — konversi ke base64 PNG untuk ditampilkan di UI
                    try {
                        const qrDataUrl = await QRCode.toDataURL(qr);
                        this.latestQr = qrDataUrl;
                        this.isInitializing = false;
                        logger.info('📱 [WHATSAPP] QR Code baru tersedia. Scan melalui Settings → WhatsApp.');
                        
                        // Emit QR ke frontend via Socket.IO
                        try {
                            const { getIO } = await import('../../socket');
                            const io = getIO();
                            if (io) io.emit('whatsapp:qr', { qr: qrDataUrl });
                        } catch (e) {}
                        
                        this.emitStatus();
                    } catch (qrErr) {
                        logger.error('❌ [WHATSAPP] Gagal konversi QR ke DataURL:', qrErr);
                    }
                }

                if (connection === 'open') {
                    this.isReady = true;
                    this.isInitializing = false;
                    this.latestQr = '';
                    this.reconnectAttempts = 0;
                    this.isReconnecting = false;
                    const phone = this.sock?.user?.id?.split(':')[0] || this.sock?.user?.id || '';
                    logger.info(`✅ [WHATSAPP] Terhubung! Nomor: ${phone}`);
                    this.emitStatus();
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const loggedOut = statusCode === DisconnectReason.loggedOut;

                    this.isReady = false;
                    this.isInitializing = false;
                    this.latestQr = '';
                    this.sock = null;

                    logger.warn(`❌ [WHATSAPP] Koneksi terputus. Code: ${statusCode}, Logged out: ${loggedOut}`);
                    this.emitStatus();

                    if (loggedOut) {
                        // Logout permanen: hapus sesi lama
                        logger.warn('⚠️ [WHATSAPP] Logout terdeteksi. Membersihkan sesi lama...');
                        this.clearSession();
                    } else {
                        // Koneksi putus tapi bukan logout: reconnect
                        this.scheduleReconnect();
                    }
                }
            });

        } catch (err: any) {
            this.isInitializing = false;
            this.isReady = false;
            logger.error(`❌ [WHATSAPP] Gagal inisialisasi: ${err.message}`);
            this.emitStatus();
            this.scheduleReconnect();
        }
    }

    /** Jadwalkan reconnect dengan exponential backoff (max 30s) */
    private scheduleReconnect() {
        if (this.isReconnecting) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('🚨 [WHATSAPP] Batas maksimal reconnect tercapai. Reset session manual diperlukan.');
            return;
        }

        this.isReconnecting = true;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        logger.warn(`♻️ [WHATSAPP] Reconnect ke-${this.reconnectAttempts} dalam ${delay / 1000}s...`);

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(async () => {
            this.isReconnecting = false;
            await this.initialize();
        }, delay);
    }

    /** Hapus folder sesi Baileys */
    private clearSession() {
        try {
            if (fs.existsSync(this.sessionDir)) {
                fs.rmSync(this.sessionDir, { recursive: true, force: true });
                fs.mkdirSync(this.sessionDir, { recursive: true });
                logger.info('🗑️ [WHATSAPP] Sesi lama dihapus.');
            }
        } catch (e: any) {
            logger.error('❌ [WHATSAPP] Gagal hapus sesi:', e.message);
        }
    }

    /** Reset session manual (dipanggil dari controller /reset) */
    public async resetSession(): Promise<void> {
        logger.warn('♻️ [WHATSAPP] Reset session manual...');

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

        // Tutup socket
        try {
            this.sock?.end(undefined);
        } catch (e) { /* ignore */ }
        this.sock = null;
        this.isReady = false;
        this.latestQr = '';

        // Hapus sesi lama
        this.clearSession();

        // Re-initialize
        await this.initialize();
    }

    /**
     * Kirim pesan WhatsApp
     * Masuk ke queue dulu — anti-ban dengan delay acak 1.5–3 detik
     */
    public async sendMessage(
        phoneNumber: string,
        message: string,
        imageUrl?: string
    ): Promise<boolean> {
        if (!this.isReady || !this.sock) {
            logger.warn(`⚠️ [WHATSAPP] Gagal kirim ke ${phoneNumber}: Client belum Ready.`);
            return false;
        }

        const cleanPhone = this.normalizePhone(phoneNumber);
        if (!cleanPhone || cleanPhone.length < 9) {
            logger.warn(`⚠️ [WHATSAPP] Nomor tidak valid: ${phoneNumber}`);
            return false;
        }

        return new Promise<boolean>((resolve) => {
            const task = async () => {
                try {
                    const jid = `${cleanPhone}@s.whatsapp.net`;

                    // 1. Anti-Ban Verification: Cegah kirim ke nomor non-WA (menjaga trust score akun WA)
                    try {
                        const checkResults = await this.sock!.onWhatsApp(cleanPhone);
                        if (checkResults && checkResults.length > 0 && !checkResults[0].exists) {
                            logger.warn(`⚠️ [WHATSAPP] Nomor ${cleanPhone} tidak terdaftar di WhatsApp. Pengiriman dibatalkan demi reputasi nomor.`);
                            resolve(false);
                            return;
                        }
                    } catch (checkErr) {
                        // Jika timeout atau gagal cek onWhatsApp, tetap lanjut pengiriman
                    }

                    // 2. Human Behavior Simulation: Simulasi status 'composing' (sedang mengetik)
                    try {
                        await this.sock!.sendPresenceUpdate('composing', jid);
                        await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
                        await this.sock!.sendPresenceUpdate('paused', jid);
                    } catch (presenceErr) {
                        // abaikan jika presence update gagal
                    }

                    if (imageUrl) {
                        try {
                            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                                await this.sock!.sendMessage(jid, { image: { url: imageUrl }, caption: message });
                            } else if (fs.existsSync(imageUrl)) {
                                await this.sock!.sendMessage(jid, { image: fs.readFileSync(imageUrl), caption: message });
                            } else {
                                await this.sock!.sendMessage(jid, { text: message });
                            }
                        } catch (imgErr: any) {
                            logger.warn(`⚠️ [WHATSAPP] Gagal kirim gambar, fallback ke pesan teks: ${imgErr.message}`);
                            await this.sock!.sendMessage(jid, { text: message });
                        }
                    } else {
                        await this.sock!.sendMessage(jid, { text: message });
                    }
                    logger.info(`✅ [WHATSAPP] Pesan terkirim ke ${phoneNumber}`);
                    resolve(true);
                } catch (err: any) {
                    logger.error(`❌ [WHATSAPP] Gagal kirim ke ${phoneNumber}: ${err.message}`);
                    resolve(false);
                }
            };

            this.messageQueue.push(task);
            this.processQueue();
        });
    }

    /**
     * Proses queue pesan satu per satu dengan delay acak 1.5–3 detik
     * Ini yang membuat tidak terblok — menyerupai pengguna manusia
     */
    private async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const task = this.messageQueue.shift();
            if (task) {
                await task();
                // Random delay 1.5 – 3 detik (anti-ban, seperti di CodePOS)
                if (this.messageQueue.length > 0) {
                    const delay = Math.floor(Math.random() * 1500) + 1500;
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        this.isProcessingQueue = false;
    }

    /** Get current status */
    public getStatus() {
        return {
            isReady: this.isReady,
            isInitializing: this.isInitializing,
            hasQr: !!this.latestQr
        };
    }
}

export const waService = new WhatsAppService();
