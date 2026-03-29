import { SerialPort } from 'serialport';
import { logger } from '../../utils/logger';
import { prisma } from '../../database/db';
import { eventBus } from '../../utils/eventBus';

export class RelayService {
    private static port: SerialPort | null = null;
    private static isConnected: boolean = false;
    private static mockStates: Record<number, boolean> = {};

    /** Port yang terakhir berhasil terhubung — prioritas saat reconnect */
    private static lastKnownPort: string | null = null;

    /** Apakah sedang dalam proses auto-scan (agar tidak double-scan) */
    private static isScanning: boolean = false;

    /** Pesan error terakhir saat mencoba membuka port */
    private static lastError: string | null = null;

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────────────────────────────────────

    static getStatus() {
        return {
            isConnected: this.isConnected,
            port: this.port ? (this.port as any).path : (this.lastKnownPort || null),
            isOpen: this.port ? (this.port as any).isOpen : false,
            lastKnownPort: this.lastKnownPort,
            isScanning: this.isScanning,
            lastError: this.lastError,
            // Flag untuk membedakan apakah ini hardware asli atau hanya bridge di VPS
            isVPS: process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCAN — Ambil daftar semua COM port yang tersedia di sistem
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mengembalikan daftar semua COM port yang terdeteksi oleh OS.
     * Aman dipanggil kapan saja tanpa efek samping.
     */
    static async scanPorts(): Promise<{ path: string; manufacturer?: string; serialNumber?: string }[]> {
        try {
            const ports = await SerialPort.list();
            logger.info(`🔍 COM Port Scan: ditemukan ${ports.length} port → [${ports.map(p => p.path).join(', ')}]`);
            return ports.map(p => ({
                path: p.path,
                manufacturer: (p as any).manufacturer,
                serialNumber: (p as any).serialNumber,
            }));
        } catch (err: any) {
            logger.error(`❌ Gagal scan COM ports: ${err.message}`);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTO-DETECT — Coba setiap port sampai ada yang bisa dibuka
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Coba buka setiap COM port yang tersedia secara berurutan.
     * Kembalikan path port pertama yang berhasil dibuka, atau null jika gagal semua.
     *
     * Strategi prioritas:
     *   1. Port yang terakhir berhasil (lastKnownPort)
     *   2. Port yang tersimpan di DB / env (preferredPort)
     *   3. Semua port lain hasil scan
     */
    static async autoDetectPort(preferredPort?: string): Promise<string | null> {
        if (this.isScanning) {
            logger.warn('⚠️ Auto-detect sudah berjalan, skip duplikat.');
            return null;
        }
        this.isScanning = true;
        logger.info('🔍 Memulai auto-detect COM port untuk relay board...');

        try {
            const allPorts = await SerialPort.list();
            if (allPorts.length === 0) {
                logger.warn('⚠️ Tidak ada COM port ditemukan di sistem ini.');
                return null;
            }

            // Susun prioritas: COM3 → lastKnown → preferred → sisanya
            const paths = allPorts.map(p => p.path).filter(p => !['COM1', 'COM2'].includes(p.toUpperCase()));
            const orderedPaths: string[] = [];

            // 1. Prioritas Utama: COM3 (Kasir) & COM4 (Laptop)
            const priorityPorts = ['COM3', 'COM4'];
            for (const p of priorityPorts) {
                if (paths.includes(p)) orderedPaths.push(p);
            }

            // 2. Port terakhir yang berhasil
            if (this.lastKnownPort && paths.includes(this.lastKnownPort) && !orderedPaths.includes(this.lastKnownPort)) {
                orderedPaths.push(this.lastKnownPort);
            }

            // 3. Port yang disarankan (dari DB/Env)
            if (preferredPort && paths.includes(preferredPort) && !orderedPaths.includes(preferredPort)) {
                orderedPaths.push(preferredPort);
            }

            for (const p of paths) {
                if (!orderedPaths.includes(p)) orderedPaths.push(p);
            }

            logger.info(`🔌 Urutan percobaan port: [${orderedPaths.join(', ')}]`);

            for (const portPath of orderedPaths) {
                const success = await this.tryOpenPort(portPath);
                if (success) {
                    logger.info(`✅ AUTO-DETECT BERHASIL: Relay terhubung di ${portPath}`);
                    this.lastKnownPort = portPath;

                    // Simpan ke database agar tidak perlu scan ulang saat restart berikutnya
                    try {
                        await prisma.venue.updateMany({ data: { relayComPort: portPath } });
                        logger.info(`💾 Port ${portPath} disimpan ke database.`);
                    } catch (dbErr: any) {
                        logger.warn(`⚠️ Gagal simpan port ke DB: ${dbErr.message}`);
                    }

                    return portPath;
                }
            }

            logger.error('❌ AUTO-DETECT GAGAL: Tidak ada COM port yang bisa dibuka untuk relay.');
            return null;
        } finally {
            this.isScanning = false;
        }
    }

    /**
     * Coba buka satu port secara sinkron (dengan timeout 2 detik).
     * Kembalikan true jika berhasil, false jika gagal.
     * Port langsung ditutup setelah tes — init() yang buka ulang secara penuh.
     */
    private static tryOpenPort(portPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                logger.warn(`⏱️ Timeout mencoba ${portPath}`);
                try { testPort.close(); } catch (_) { }
                resolve(false);
            }, 2000);

            let testPort: SerialPort;
            try {
                testPort = new SerialPort({
                    path: portPath,
                    baudRate: 9600,
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1,
                    autoOpen: false,
                });
            } catch (err: any) {
                clearTimeout(timeout);
                logger.warn(`⚠️ Tidak bisa buat port ${portPath}: ${err.message}`);
                resolve(false);
                return;
            }

            testPort.open((err) => {
                clearTimeout(timeout);
                if (err) {
                    this.lastError = err.message;
                    logger.warn(`⚠️ ${portPath}: ${err.message}`);
                    resolve(false);
                } else {
                    this.lastError = null;
                    // Berhasil dibuka — tutup segera, init() akan buka ulang dengan full setup
                    testPort.close((closeErr) => {
                        if (closeErr) logger.warn(`⚠️ Error menutup test port ${portPath}: ${closeErr.message}`);
                        resolve(true);
                    });
                }
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT — Buka koneksi penuh ke port relay
    // ─────────────────────────────────────────────────────────────────────────

    static async init(forceComPort?: string) {
        const self = this as any;
        if (self.port) return;

        // Jangan jalankan hardware init jika di VPS mode
        if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
            logger.info('☁️ VPS Mode detected: Serial port hardware disabled.');
            self.isConnected = false;
            return;
        }

        let comPortPath = forceComPort;

        if (!comPortPath) {
            // Prioritas: ENV Lokal (Laptop/Kasir) > Database Cloud
            try {
                const venue: any = await prisma.venue.findFirst();
                comPortPath = process.env.RELAY_COM_PORT || venue?.relayComPort || 'COM3';
                
                if (process.env.RELAY_COM_PORT) {
                    logger.info(`📝 Local ENV priority: Port ${comPortPath}`);
                }
            } catch (e) {
                comPortPath = process.env.RELAY_COM_PORT || 'COM3';
            }
        }

        logger.info(`🔌 Mencoba relay pada ${comPortPath} (9600 baud, 8-N-1)...`);

        // Tutup port lama kalau masih terbuka
        if (self.port && self.port.isOpen) {
            await new Promise<void>((res) => self.port.close(() => res()));
            await new Promise<void>((res) => setTimeout(res, 300));
        }

        try {
            self.port = new SerialPort({
                path: comPortPath as string,
                baudRate: 9600,
                dataBits: 8,
                parity: 'none',
                stopBits: 1,
                autoOpen: false,
            });

            self.port.open((err: any) => {
                if (err) {
                    self.lastError = err.message;
                    logger.error(`❌ HARDWARE ERROR: ${comPortPath} - ${err.message}`);
                    self.updateConnectionStatus(false);

                    // Port gagal → coba auto-detect port lain secara diam-diam
                    if (!self.lastKnownPort || comPortPath === self.lastKnownPort) {
                        setTimeout(() => {
                            self.autoDetectPort(comPortPath as string).then((found: any) => {
                                if (found) self.init(found);
                                else {
                                    // Jika gagal semua, coba lagi dlm 10 detik (looping scan)
                                    setTimeout(() => self.init(), 10000);
                                }
                            });
                        }, 2000);
                    }
                } else {
                    logger.info(`✅ HARDWARE SUCCESS: Relay terhubung di ${comPortPath} ⚡`);
                    self.updateConnectionStatus(true);
                    self.lastKnownPort = comPortPath as string;

                    // --- JEDA SETTLE TIME (2 DETIK) ---
                    logger.info('⏳ Hardware Settle Time: Menunggu 2 detik...');
                    setTimeout(() => {
                        logger.info('🚀 Hardware Ready: Relay siap.');
                    }, 2000);
                }
            });

            self.port.on('close', () => {
                logger.warn(`⚠️ Serial port ${comPortPath} tertutup.`);
                self.updateConnectionStatus(false);
                setTimeout(() => self.init(), 5000);
            });

            self.port.on('error', (err: any) => {
                logger.error(`🚨 Serial Port Error: ${err.message}`);
                self.updateConnectionStatus(false);
            });
        } catch (error: any) {
            logger.error(`❌ Hardware Relay Init Gagal: ${error.message}`);
            self.updateConnectionStatus(false);
            setTimeout(async () => {
                const found = await self.autoDetectPort();
                if (found) self.init(found);
                else setTimeout(() => self.init(), 10000);
            }, 5000);
        }

        // Inisialisasi mock states
        for (let i = 1; i <= 20; i++) {
            if (self.mockStates[i] === undefined) self.mockStates[i] = false;
        }

        self.startBlinkMonitor();
    }

    /**
     * Force reconnect — dipanggil dari controller/admin panel.
     * Bersihkan koneksi lama lalu coba auto-detect ulang dari awal.
     */
    static async reconnect(): Promise<{ success: boolean; port: string | null; message: string }> {
        logger.info('♻️ Force reconnect diminta...');

        // Tutup port yang ada
        if (this.port && this.port.isOpen) {
            await new Promise<void>((res) => this.port!.close(() => res()));
        }
        this.isConnected = false;

        // Reset lastKnownPort agar auto-detect tidak langsung stick ke port lama yang rusak
        const prevPort = this.lastKnownPort;
        this.lastKnownPort = null;

        const found = await this.autoDetectPort(prevPort ?? undefined);
        if (found) {
            await this.init(found);
            return { success: true, port: found, message: `Relay berhasil terhubung kembali di ${found}` };
        }

        return { success: false, port: null, message: 'Tidak ada COM port yang bisa dihubungkan.' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BLINK MONITOR
    // ─────────────────────────────────────────────────────────────────────────

    private static blinkMonitorInterval: NodeJS.Timeout | null = null;
    static lastBlinked: Record<string, number> = {};

    static async startBlinkMonitor() {
        if (this.blinkMonitorInterval) clearInterval(this.blinkMonitorInterval);

        this.blinkMonitorInterval = setInterval(async () => {
            try {
                const venue = await prisma.venue.findFirst() as any;
                const warningMins = venue?.blinkWarningMinutes || 5;

                const activeSessions = await prisma.session.findMany({
                    where: { status: 'ACTIVE', durationOpts: { not: null }, tableId: { not: null } },
                    include: { table: true }
                });

                const now = Date.now();

                for (const session of activeSessions) {
                    if (!session.table || !session.durationOpts) continue;

                    const startMs = new Date(session.startTime).getTime();
                    const endMs = startMs + (session.durationOpts * 60000);
                    const remainingMins = (endMs - now) / 60000;

                    // Cek jika sudah masuk dalam zona peringatan (misal 5 menit)
                    // Dan pastikan hanya berkedip SEKALI per sesi pada menit tersebut.
                    if (remainingMins > 0 && remainingMins <= warningMins) {
                        const alreadyBlinked = !!this.lastBlinked[session.id];
                        if (!alreadyBlinked) {
                            this.lastBlinked[session.id] = now;
                            logger.info(`🚨 Session ${session.id} sisa ${Math.ceil(remainingMins)} menit. Lampu meja ${session.table.name} berkedip SEKALI sebagai peringatan.`);
                            this.blink(session.table.relayChannel);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Blink monitor error: ${error}`);
            }
        }, 30000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMAND QUEUE & SEND
    // ─────────────────────────────────────────────────────────────────────────

    private static lock: boolean = false;
    private static lockTime: number = 0;
    private static queue: Array<{ channel: number; command: 'on' | 'off' }> = [];

    static async sendCommand(channel: number, command: 'on' | 'off'): Promise<boolean> {
        const isOn = command === 'on';
        logger.info(`📡 RELAY: Meja ${channel} → ${command.toUpperCase()}`);

        this.mockStates[channel] = isOn;

        // --- BRIDGE: Broadcast ke Socket agar Electron Bridge di lokal bisa menangkap ---
        try {
            const { getIO } = await import('../../socket');
            const io = getIO();
            if (io) {
                io.emit('relay:command', { channel, status: command });
            }
        } catch (e) {
            // Abaikan jika socket belum siap
        }

        // Jika di VPS (bukan local electron), jangan lanjut ke serial port hardware
        if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
            logger.info(`☁️ VPS Mode: Perintah dipancarkan via Socket (Hardware Sync).`);
            return true;
        }

        // Jalankan perintah serial asli khusus di aplikasi lokal (Electron)
        this.burstAsync(channel, isOn).catch(e => {
            logger.error(`🚨 Relay Error Hardware Meja ${channel}: ${e.message}`);
        });
        return true;
    }

    private static async burstAsync(channel: number, isOn: boolean): Promise<void> {
        if (this.lock && (Date.now() - this.lockTime < 5000)) {
            this.queue.push({ channel, command: isOn ? 'on' : 'off' });
            return;
        }
        this.lock = true;
        this.lockTime = Date.now();

        const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        const writeRaw = (data: Buffer | string): Promise<void> => {
            return new Promise<void>((resolve) => {
                if (!this.port || !this.port.isOpen) {
                    logger.warn('Port tertutup saat write, memulai reconnect...');
                    this.init().then(() => resolve());
                    return;
                }
                const display = Buffer.isBuffer(data)
                    ? `HEX[${(data as Buffer).toString('hex').toUpperCase().replace(/../g, '$& ').trim()}]`
                    : data.trim();
                logger.info(`[SERIAL] Kirim: ${display}`);
                this.port.write(data as any, (err: any) => {
                    if (err) logger.error(`[SERIAL ERR]: ${err.message}`);
                    // Gunakan delay minimal (50ms) agar respons "instan" tapi data tetap terkirim stabil
                    setTimeout(resolve, 50);
                });
            });
        };

        try {
            // Protocol String ASCII: Format "101\r\n" untuk Meja 10 ON
            // Ini adalah protokol yang sudah kita uji dan BERHASIL menyalakan lampu.
            const cmd = `${channel}${isOn ? '1' : '0'}\r\n`;

            logger.info(`⚡ COMMAND (STRING): Meja ${channel} → ${isOn ? 'ON' : 'OFF'} [${cmd.trim()}]`);

            await writeRaw(cmd);
            await delay(50); // Jeda antar pengiriman redundansi
            await writeRaw(cmd); 

            logger.info(`✅ SENT: Meja ${channel}`);
        } catch (error: any) {
            logger.error(`❌ FAIL Meja ${channel}: ${error.message}`);
        } finally {
            await delay(50);
            this.lock = false;
            const next = this.queue.shift();
            if (next) {
                setTimeout(() => {
                    this.burstAsync(next.channel, next.command === 'on').catch(() => { });
                }, 50); // Jeda antar antrean dipercepat (sebelumnya 200ms)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BLINK & STATE
    // ─────────────────────────────────────────────────────────────────────────

    static async getChannelState(channel: number): Promise<boolean> {
        return this.mockStates[channel] || false;
    }

    static async blink(channel: number): Promise<void> {
        // Simpan state asli sebelum berkedip
        const originalState = this.mockStates[channel];
        
        // --- BLINK 2 KALI (OFF-ON-OFF-ON) ---
        // Sesuai permintaan user: Meja berkedip 2x sebagai peringatan (jeda 600ms).
        logger.info(`🚨 BLINK Meja ${channel} started (2 cycles)...`);

        try {
            // Kedip 1
            await this.burstAsync(channel, false);
            await new Promise(r => setTimeout(r, 600));
            await this.burstAsync(channel, true);
            await new Promise(r => setTimeout(r, 600));

            // Kedip 2 
            await this.burstAsync(channel, false);
            await new Promise(r => setTimeout(r, 600));
            
            // Kembalikan ke state asli (biasanya ON untuk sesi aktif)
            await this.burstAsync(channel, originalState);
            logger.info(`🚨 BLINK Meja ${channel} finished. Returned to state: ${originalState ? 'ON' : 'OFF'}`);
        } catch (err: any) {
            logger.error(`🚨 BLINK ERROR Meja ${channel}: ${err.message}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODBUS CRC16 (helper)
    // ─────────────────────────────────────────────────────────────────────────

    private static calculateCRC(buffer: Buffer): number {
        let crc = 0xFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x0001) !== 0) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc >>= 1;
                }
            }
        }
        return crc;
    }
    private static async updateConnectionStatus(status: boolean) {
        if (this.isConnected !== status) {
            this.isConnected = status;
            
            // Siarkan status ke pusat (Event Bus) agar ditangkap Socket Bridge
            eventBus.emit('hardware:status', status);
            logger.info(`📡 [RELAY] Status Hardware diperbarui: ${status ? 'ONLINE' : 'OFFLINE'}`);
        }
    }
}

// Auto init saat modul diimport
RelayService.init();
