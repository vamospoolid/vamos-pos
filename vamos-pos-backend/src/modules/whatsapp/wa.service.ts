import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from '../../utils/logger';

class WhatsAppService {
    private client: Client;
    public isReady: boolean = false;
    public latestQr: string = '';
    public isInitializing: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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
                    '--single-process', // <- this can help in some envs
                    '--disable-gpu'
                ]
            }
        });

        this.client.on('qr', (qr) => {
            logger.info('\n======================================================');
            logger.info('📱 [WHATSAPP] Silakan SCAN QR Code di bawah dengan aplikasi WhatsApp Anda:');
            logger.info('======================================================\n');
            this.latestQr = qr;
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            this.isReady = true;
            this.latestQr = '';
            logger.info('✅ [WHATSAPP] Client is READY! Berhasil terhubung ke WhatsApp Admin.');
        });

        this.client.on('authenticated', () => {
            logger.info('✅ [WHATSAPP] Authenticated!');
        });

        this.client.on('auth_failure', msg => {
            logger.error('❌ [WHATSAPP] Authentication failure', msg);
            this.isInitializing = false;
        });

        this.client.on('disconnected', (reason) => {
            logger.error('❌ [WHATSAPP] Client disconnected:', reason);
            this.isReady = false;
            this.latestQr = '';
        });
    }

    private setupClient() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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

        this.client.on('qr', (qr) => {
            this.latestQr = qr;
            this.isInitializing = false; // QR is here, not blocked anymore
            logger.info('📱 [WHATSAPP] New QR Code generated');
        });

        this.client.on('ready', () => {
            this.isReady = true;
            this.isInitializing = false;
            this.latestQr = '';
            logger.info('✅ [WHATSAPP] Client is READY!');
        });

        this.client.on('authenticated', () => {
            logger.info('✅ [WHATSAPP] Authenticated!');
        });

        this.client.on('auth_failure', msg => {
            logger.error('❌ [WHATSAPP] Authentication failure', msg);
            this.isInitializing = false;
        });

        this.client.on('disconnected', (reason) => {
            logger.error('❌ [WHATSAPP] Client disconnected:', reason);
            this.isReady = false;
            this.latestQr = '';
        });
    }

    public async resetSession() {
        try {
            logger.info('♻️ [WHATSAPP] Resetting session...');
            await this.client.destroy();
        } catch (e) { }

        this.isReady = false;
        this.latestQr = '';

        // Manually delete the .wwebjs_auth folder if it exists
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(process.cwd(), '.wwebjs_auth');

        if (fs.existsSync(authPath)) {
            try {
                fs.rmSync(authPath, { recursive: true, force: true });
                logger.info('🗑️ [WHATSAPP] Auth folder deleted.');
            } catch (e) {
                logger.error('❌ [WHATSAPP] Failed to delete auth folder:', e);
            }
        }

        this.setupClient();
        return this.initialize();
    }

    public initialize(): Promise<void> {
        if (this.isInitializing) {
            logger.warn('⚠️ [WHATSAPP] Already initializing, skipping duplicate call.');
            return Promise.resolve();
        }
        this.isInitializing = true;
        logger.info('⏳ [WHATSAPP] Menyiapkan WhatsApp Web Engine...');
        return this.client.initialize().then(() => {
            this.isInitializing = false;
        }).catch(err => {
            this.isInitializing = false;
            logger.error('❌ [WHATSAPP] Failed to initialize WhatsApp Client:', err);
        });
    }

    public async sendMessage(phoneNumber: string, message: string, imageUrl?: string) {
        if (!this.isReady) {
            logger.warn('⚠️ [WHATSAPP] Pesan tidak terkirim. Whatsapp belum READY.');
            return false;
        }

        try {
            const { MessageMedia } = await import('whatsapp-web.js');

            // Bersihkan nomor telepon (hanya digit)
            let formattedNumber = phoneNumber.replace(/\D/g, '');

            // Konversi awalan 0 menjadi 62, tambahkan 62 jika langsung awalan 8
            if (formattedNumber.startsWith('0')) {
                formattedNumber = '62' + formattedNumber.slice(1);
            } else if (formattedNumber.startsWith('8')) {
                formattedNumber = '62' + formattedNumber;
            }

            // Tambahkan @c.us untuk nomor perseorangan
            if (!formattedNumber.endsWith('@c.us')) {
                formattedNumber += '@c.us';
            }

            if (imageUrl) {
                try {
                    const media = await MessageMedia.fromUrl(imageUrl);
                    await this.client.sendMessage(formattedNumber, media, { caption: message });
                    logger.info(`✅ [WHATSAPP] Pesan + Gambar terkirim ke ${phoneNumber}`);
                } catch (mediaError: any) {
                    logger.error(`❌ [WHATSAPP] Gagal memuat/mengirim media dari ${imageUrl}, mengirim teks saja:`, mediaError.message);
                    await this.client.sendMessage(formattedNumber, message);
                    logger.info(`✅ [WHATSAPP] Pesan teks (tanpa gambar) terkirim ke ${phoneNumber}`);
                }
            } else {
                await this.client.sendMessage(formattedNumber, message);
                logger.info(`✅ [WHATSAPP] Pesan terkirim ke ${phoneNumber}`);
            }
            return true;
        } catch (error: any) {
            logger.error(`❌ [WHATSAPP] Gagal mengirim pesan ke ${phoneNumber}:`, error.message);
            return false;
        }
    }

}

export const waService = new WhatsAppService();
