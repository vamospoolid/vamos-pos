import { SerialPort } from 'serialport';
import { logger } from '../../utils/logger';
import { prisma } from '../../database/db';

export class RelayService {
    private static port: SerialPort | null = null;
    private static isConnected: boolean = false;
    private static mockStates: Record<number, boolean> = {};

    static getStatus() {
        return {
            isConnected: this.isConnected,
            port: this.port?.path,
            isOpen: this.port?.isOpen || false
        };
    }

    static async init(forceComPort?: string) {
        let comPortPath = forceComPort;
        if (!comPortPath) {
            try {
                const venue = await prisma.venue.findFirst();
                comPortPath = venue?.relayComPort || process.env.RELAY_COM_PORT || 'COM3';
            } catch (e) {
                comPortPath = process.env.RELAY_COM_PORT || 'COM3';
            }
        }

        const baud = 9600;
        logger.info(`🔌 Attempting to connect relay on ${comPortPath} (Baud: ${baud}, 8-N-1)...`);

        const openPort = () => {
            try {
                this.port = new SerialPort({
                    path: comPortPath as string,
                    baudRate: 9600,
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1,
                    autoOpen: false
                });

                this.port.open((err) => {
                    if (err) {
                        logger.error(`❌ HARDWARE ERROR: Could not open ${comPortPath} - ${err.message}`);
                        this.isConnected = false;
                    } else {
                        logger.info(`✅ HARDWARE SUCCESS: Connected to ${comPortPath} ⚡`);
                        this.isConnected = true;
                    }
                });

                this.port.on('close', () => {
                    logger.warn(`⚠️ Serial port ${comPortPath} closed. Auto-reconnect in 10s...`);
                    this.isConnected = false;
                    setTimeout(() => this.init(comPortPath), 10000);
                });

                this.port.on('error', (err) => {
                    logger.error(`🚨 Serial Port Error: ${err.message}`);
                    this.isConnected = false;
                });
            } catch (error: any) {
                logger.error(`❌ Hardware Relay Initialization Failed: ${error.message}`);
                this.isConnected = false;
            }
        };

        // Close existing port if re-initializing
        if (this.port && this.port.isOpen) {
            this.port.close(() => {
                setTimeout(openPort, 300);
            });
        } else {
            openPort();
        }

        for (let i = 1; i <= 20; i++) {
            if (this.mockStates[i] === undefined) this.mockStates[i] = false;
        }

        this.startBlinkMonitor();
    }

    private static blinkMonitorInterval: NodeJS.Timeout | null = null;
    static lastBlinked: Record<string, number> = {};

    static async startBlinkMonitor() {
        if (this.blinkMonitorInterval) clearInterval(this.blinkMonitorInterval);

        this.blinkMonitorInterval = setInterval(async () => {
            try {
                // Determine blink threshold from Venue
                const venue = await prisma.venue.findFirst() as any;
                const warningMins = venue?.blinkWarningMinutes || 5;

                // Find ACTIVE sessions with durationOpts
                const activeSessions = await prisma.session.findMany({
                    where: { status: 'ACTIVE', durationOpts: { not: null }, tableId: { not: null } },
                    include: { table: true }
                });

                const now = Date.now();

                for (const session of activeSessions) {
                    if (!session.table || !session.durationOpts) continue;

                    const startMs = new Date(session.startTime).getTime();
                    const endMs = startMs + session.durationOpts * 60000;
                    const remainingMins = (endMs - now) / 60000;

                    if (remainingMins > 0 && remainingMins <= warningMins) {
                        // Only blink once every 2 minutes or less?
                        // Let's blink once per minute
                        const lastBlink = this.lastBlinked[session.id] || 0;
                        if (now - lastBlink > 45000) { // at least 45 seconds gap
                            this.lastBlinked[session.id] = now;
                            logger.info(`🚨 Session ${session.id} nearing end! Blinking table ${session.table.name}...`);
                            this.blink(session.table.relayChannel);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Blink monitor error: ${error}`);
            }
        }, 30000); // Check every 30 seconds
    }

    // Helper for Modbus CRC16
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

    private static lock: boolean = false;
    private static queue: Array<{ channel: number; command: 'on' | 'off' }> = [];

    /**
     * sendCommand — fire-and-forget friendly.
     * Resolve segera setelah command dikirim (tidak nunggu burst selesai).
     * Delay per burst dikurangi dari 800ms → 150ms.
     */
    private static lockTime: number = 0;

    static async sendCommand(channel: number, command: 'on' | 'off'): Promise<boolean> {
        const isOn = command === 'on';
        logger.info(`📡 RELAY: Ordering Meja ${channel} -> ${command.toUpperCase()}`);

        // Safety: If lock is stuck for more than 5 seconds, force reset
        if (this.lock && Date.now() - this.lockTime > 5000) {
            logger.warn('⚠️ Relay lock stuck for > 5s. Forcing reset.');
            this.lock = false;
        }

        this.mockStates[channel] = isOn;

        if (this.isConnected && this.port && this.port.isOpen) {
            this.burstAsync(channel, isOn).catch(e => {
                logger.error(`🚨 Relay Error Meja ${channel}: ${e.message}`);
            });
            return true;
        } else {
            logger.info(`[SIMULATOR]: Meja ${channel} is now ${isOn ? '🟢 ON' : '🔴 OFF'}`);
            return true;
        }
    }

    /**
     * burstAsync — kirim semua format command ke hardware secara async di background.
     * Delay dikurangi: 150ms per step (dari 800ms).
     */
    private static async burstAsync(channel: number, isOn: boolean): Promise<void> {
        if (this.lock) {
            this.queue.push({ channel, command: isOn ? 'on' : 'off' });
            return;
        }
        this.lock = true;
        this.lockTime = Date.now();

        const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        const writeRaw = (data: string): Promise<void> => {
            return new Promise<void>((resolve) => {
                if (!this.port || !this.port.isOpen) {
                    logger.warn('Port closed during write, attempting reconnect...');
                    this.init().then(() => resolve());
                    return;
                }

                logger.info(`[SERIAL] Sending: ${data.trim()}`);
                this.port.write(data, (err) => {
                    if (err) logger.error(`[SERIAL ERR]: ${err.message}`);
                    // Significant delay after every single write for hardware stability
                    setTimeout(resolve, 300);
                });
            });
        };

        try {
            const cStr = channel.toString();
            // Standard format: '11\r\n' for Meja 1 ON, '10\r\n' for Meja 1 OFF
            const state = isOn ? '1' : '0';
            const cmd = `${cStr}${state}\r\n`;

            logger.info(`⚡ COMMAND: Meja ${channel} -> ${isOn ? 'ON' : 'OFF'}`);

            // Only send the primary format. Multiple formats cause buffer collisions.
            await writeRaw(cmd);

            // Send a second time just for redundancy, with a gap
            await delay(200);
            await writeRaw(cmd);

            logger.info(`✅ SENT: Meja ${channel}`);
        } catch (error: any) {
            logger.error(`❌ FAIL Meja ${channel}: ${error.message}`);
        } finally {
            await delay(200);
            this.lock = false;
            const next = this.queue.shift();
            if (next) {
                setTimeout(() => {
                    this.burstAsync(next.channel, next.command === 'on').catch(() => { });
                }, 200);
            }
        }
    }

    static async getChannelState(channel: number): Promise<boolean> {
        return this.mockStates[channel] || false;
    }

    static async blink(channel: number): Promise<void> {
        if (!this.isConnected || !this.port || !this.port.isOpen) return;
        try {
            // Kita bypass SETTING mock states, namun TETAP memakai antrean burstAsync
            // Supaya kasir yang klik END SESSION tidak terhambat (karena mockStates tetap ON)
            this.burstAsync(channel, false).catch(e => logger.error(`Blink Off Error: ${e}`));

            setTimeout(() => {
                // Mengecek apakah meja masih ON di memori (belum di End Session oleh kasir 1.5 detik yang lalu)
                const isSupposedToBeOn = this.mockStates[channel];
                if (isSupposedToBeOn) {
                    this.burstAsync(channel, true).catch(e => logger.error(`Blink On Error: ${e}`));
                }
            }, 1500);
        } catch (e) {
            logger.error(`Blink error: ${e}`);
        }
    }
}

// Auto init upon importing this service
RelayService.init();
