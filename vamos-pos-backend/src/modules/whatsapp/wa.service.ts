import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';

class WhatsAppService {
    private client!: Client;
    public isReady: boolean = false;
    public latestQr: string = '';
    public isInitializing: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 10;
    private reconnectTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        if (this.client) {
            try {
                this.client.destroy();
            } catch (e) { }
        }

        this.client = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: {
                type: 'none'
            },
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-extensions',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.client.on('qr', (qr) => {
            this.latestQr = qr;
            this.isInitializing = false;
            logger.info('📱 [WHATSAPP] New QR Code generated. Silakan scan melalui Admin Settings.');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            this.isReady = true;
            this.isInitializing = false;
            this.latestQr = '';
            this.reconnectAttempts = 0; // reset attempts on success
            logger.info('✅ [WHATSAPP] Client is READY! Koneksi aktif.');
        });

        this.client.on('authenticated', () => {
            logger.info('✅ [WHATSAPP] Berhasil terautentikasi.');
        });

        this.client.on('auth_failure', msg => {
            logger.error(`❌ [WHATSAPP] Autentikasi gagal: ${msg}`);
            this.isInitializing = false;
            this.isReady = false;
        });

        this.client.on('change_state', state => {
            logger.warn(`⚠️ [WHATSAPP] Status berubah: ${state}`);
        });

        this.client.on('disconnected', (reason) => {
            logger.error(`❌ [WHATSAPP] Terputus: ${reason}`);
            this.isReady = false;
            this.latestQr = '';
            this.handleReconnect();
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('🚨 [WHATSAPP] Maksimal percobaan koneksi ulang tercapai. Mohon reset session manual.');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff max 30s
        this.reconnectAttempts++;

        logger.warn(`♻️ [WHATSAPP] Mencoba koneksi ulang ke-${this.reconnectAttempts} dalam ${delay / 1000} detik...`);

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.initialize();
        }, delay);
    }

    public async resetSession() {
        logger.warn('♻️ [WHATSAPP] Melakukan reset session manual...');
        
        try {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            await this.client.destroy();
        } catch (e) { }

        this.isReady = false;
        this.reconnectAttempts = 0;
        this.latestQr = '';

        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        if (fs.existsSync(authPath)) {
            try {
                fs.rmSync(authPath, { recursive: true, force: true });
                logger.info('🗑️ [WHATSAPP] Sesi lama dihapus (.wwebjs_auth)');
            } catch (e) {
                logger.error('❌ [WHATSAPP] Gagal menghapus folder sesi:', e);
            }
        }

        this.initializeClient();
        return this.initialize();
    }

    public async initialize(): Promise<void> {
        if (this.isInitializing) return;
        
        this.isInitializing = true;
        logger.info('⏳ [WHATSAPP] Menginisialisasi engine...');
        
        try {
            await this.client.initialize();
            this.isInitializing = false;
        } catch (err: any) {
            this.isInitializing = false;
            logger.error(`❌ [WHATSAPP] Inisialisasi gagal: ${err.message}`);
            this.handleReconnect();
        }
    }

    public async sendMessage(phoneNumber: string, message: string, imageUrl?: string) {
        if (!this.isReady) {
            logger.warn(`⚠️ [WHATSAPP] Gagal kirim ke ${phoneNumber}: Client belum Ready.`);
            return false;
        }

        try {
            const { MessageMedia } = await import('whatsapp-web.js');

            let formattedNumber = phoneNumber.replace(/\D/g, '');
            if (formattedNumber.startsWith('0')) {
                formattedNumber = '62' + formattedNumber.slice(1);
            } else if (formattedNumber.startsWith('8')) {
                formattedNumber = '62' + formattedNumber;
            }

            if (!formattedNumber.endsWith('@c.us')) {
                formattedNumber += '@c.us';
            }

            if (imageUrl) {
                try {
                    const media = await MessageMedia.fromUrl(imageUrl);
                    await this.client.sendMessage(formattedNumber, media, { caption: message });
                    logger.info(`✅ [WHATSAPP] Pesan + Gambar terkirim ke ${phoneNumber}`);
                } catch (mediaError: any) {
                    logger.error(`❌ [WHATSAPP] Gambar gagal dimuat (${imageUrl}), kirim teks saja.`);
                    await this.client.sendMessage(formattedNumber, message);
                    logger.info(`✅ [WHATSAPP] Pesan teks terkirim ke ${phoneNumber}`);
                }
            } else {
                await this.client.sendMessage(formattedNumber, message);
                logger.info(`✅ [WHATSAPP] Pesan terkirim ke ${phoneNumber}`);
            }
            return true;
        } catch (error: any) {
            logger.error(`❌ [WHATSAPP] Gagal kirim pesan ke ${phoneNumber}: ${error.message}`);
            return false;
        }
    }
}

export const waService = new WhatsAppService();
