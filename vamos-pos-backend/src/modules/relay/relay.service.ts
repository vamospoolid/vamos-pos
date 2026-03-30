import { SerialPort } from 'serialport';
import { logger } from '../../utils/logger';
import { prisma } from '../../database/db';
import { eventBus } from '../../utils/eventBus';

export class RelayService {
    private static port: SerialPort | null = null;
    private static isConnected: boolean = false;
    private static mockStates: Record<number, boolean> = {};
    private static lastKnownPort: string | null = null;
    private static isScanning: boolean = false;
    private static lastError: string | null = null;

    private static lock: boolean = false;
    private static lockTime: number = 0;
    private static queue: Array<{ channel: number; command: 'on' | 'off' }> = [];

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────────────────────────────────────

    static async notifyConfigUpdate(port: string) {
        try {
            const { getIO, getCloudSocket } = await import('../../socket');
            const io = getIO();
            const cloudSocket = getCloudSocket();
            const status = this.getStatus();

            // 1. Broadcast to Local UI (Cashier)
            if (io) {
                io.emit('relay:config:update', { port });
                io.emit('bridge:hardware:status', { ...status, isBridge: true });
                logger.info(`📡 [BRIDGE_CONFIG] Local broadcast port: ${port}`);
            }

            // 2. Sync to Cloud (VPS)
            if (cloudSocket && cloudSocket.connected) {
                cloudSocket.emit('bridge:status:update', status);
                logger.info(`📡 [BRIDGE_CONFIG] Syncing port ${port} to Cloud...`);
            }
        } catch (e) { }
    }

    static getStatus() {
        const { getHardwareId } = require('../../utils/hardware.utils');
        return {
            isConnected: this.isConnected,
            port: this.port ? (this.port as any).path : (this.lastKnownPort || null),
            isOpen: this.port ? (this.port as any).isOpen : false,
            lastKnownPort: this.lastKnownPort,
            isScanning: this.isScanning,
            lastError: this.lastError,
            isVPS: process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON,
            hardwareId: getHardwareId() // Get Local HWID
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCAN & AUTO-DETECT
    // ─────────────────────────────────────────────────────────────────────────

    static async scanPorts(): Promise<any[]> {
        try {
            const ports = await SerialPort.list();
            return ports.map(p => ({ path: p.path, manufacturer: (p as any).manufacturer }));
        } catch (err: any) {
            return [];
        }
    }

    static async autoDetectPort(preferredPort?: string): Promise<string | null> {
        if (this.isScanning) return null;
        this.isScanning = true;
        try {
            const allPorts = await SerialPort.list();
            
            // 1. Filter only CH340-like ports which are common for our relay (VendorId: 1a86, ProductId: 7523)
            // But we keep others as fallback if CH340 filter is too strict.
            const ch340Paths = allPorts
                .filter(p => p.vendorId?.toLowerCase() === '1a86' || p.manufacturer?.toLowerCase().includes('wch'))
                .map(p => p.path);
            
            const otherPaths = allPorts
                .filter(p => !ch340Paths.includes(p.path))
                .map(p => p.path)
                .filter(p => !['COM1', 'COM2'].includes(p.toUpperCase()));

            const orderedPaths: string[] = [];
            
            // Priority 1: Preferred port (if it exists)
            if (preferredPort && [...ch340Paths, ...otherPaths].includes(preferredPort)) {
                orderedPaths.push(preferredPort);
            }
            
            // Priority 2: CH340 ports (The most likely ones)
            ch340Paths.forEach(p => { if (!orderedPaths.includes(p)) orderedPaths.push(p); });
            
            // Priority 3: COM3/COM4 (Common fallbacks)
            ['COM3', 'COM4'].forEach(p => { 
                if (otherPaths.includes(p) && !orderedPaths.includes(p)) orderedPaths.push(p); 
            });

            // Priority 4: All other available ports
            otherPaths.forEach(p => { if (!orderedPaths.includes(p)) orderedPaths.push(p); });

            for (const portPath of orderedPaths) {
                const isCH340 = ch340Paths.includes(portPath);
                logger.info(`🔍 [AUTO-SCAN] Testing port: ${portPath} ${isCH340 ? '(CH340 Match)' : ''}`);
                
                const success = await this.tryOpenPort(portPath);
                if (success) {
                    this.lastKnownPort = portPath;
                    this.notifyConfigUpdate(portPath); // Tell Cloud we found a working port!
                    try { 
                        await prisma.venue.updateMany({ data: { relayComPort: portPath } }); 
                        logger.info(`✅ [AUTO-SCAN] Port found and saved: ${portPath}`);
                    } catch (e) {}
                    return portPath;
                }
            }
            return null;
        } finally {
            this.isScanning = false;
        }
    }

    private static tryOpenPort(portPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            let testPort: SerialPort;
            try {
                testPort = new SerialPort({ path: portPath, baudRate: 9600, autoOpen: false });
                testPort.open((err) => {
                    if (err) resolve(false);
                    else {
                        testPort.close(() => resolve(true));
                    }
                });
            } catch (e) { resolve(false); }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────

    static async init(forceComPort?: string) {
        const self = this as any;
        if (self.port) {
            if (forceComPort && self.port.path !== forceComPort) {
                await new Promise<void>(res => self.port.close(() => res()));
                self.port = null;
            } else return;
        }

        if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
            logger.info('☁️ VPS Mode: Serial port disabled.');
            self.isConnected = false;
            return;
        }

        let comPortPath = forceComPort;
        if (!comPortPath) {
            try {
                const venue: any = await prisma.venue.findFirst();
                comPortPath = process.env.RELAY_COM_PORT || venue?.relayComPort || 'COM3';
            } catch (e) { comPortPath = process.env.RELAY_COM_PORT || 'COM3'; }
        }

        try {
            self.port = new SerialPort({ path: comPortPath as string, baudRate: 9600, autoOpen: false });
            self.port.open((err: any) => {
                if (err) {
                    logger.error(`❌ HARDWARE ERROR: ${comPortPath} - ${err.message}`);
                    self.updateConnectionStatus(false);
                    this.autoDetectPort(comPortPath as string).then(found => { if (found) this.init(found); });
                } else {
                    logger.info(`✅ HARDWARE SUCCESS: ${comPortPath}`);
                    self.updateConnectionStatus(true);
                    self.lastKnownPort = comPortPath as string;
                }
            });

            self.port.on('close', () => { self.updateConnectionStatus(false); setTimeout(() => this.init(), 5000); });
            self.port.on('error', () => { self.updateConnectionStatus(false); });
        } catch (e) { self.updateConnectionStatus(false); }

        for (let i = 1; i <= 20; i++) { if (self.mockStates[i] === undefined) self.mockStates[i] = false; }
        
        // Sync mockStates with current table status from DB
        try {
            const tables = await prisma.table.findMany({ where: { status: 'PLAYING' } });
            for (const t of tables) {
                if (t.relayChannel) self.mockStates[t.relayChannel] = true;
            }
        } catch (e) {}
    }

    static async reconnect() {
        if (this.port) await new Promise<void>(res => this.port!.close(() => res()));
        this.port = null;
        const found = await this.autoDetectPort();
        await this.init(found || undefined);
        const status = this.getStatus();
        return { success: status.isConnected, port: status.port, message: status.isConnected ? 'Reconnected' : 'Failed' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMANDS
    // ─────────────────────────────────────────────────────────────────────────

    static async sendCommand(channel: number, status: 'on' | 'off'): Promise<boolean> {
        const command = status === 'on' ? 'on' : 'off';
        const self = this as any;

        // 1. Enforce License for hardware control (Local Bridge only)
        if (process.env.IS_LOCAL_ELECTRON && status === 'on') {
            try {
                const { LicenseService } = await import('../license/license.service');
                const ls = new LicenseService();
                const isActivated = await ls.verify();
                if (!isActivated) {
                    logger.error(`🚨 [RELAY] UNAUTHORIZED: License missing or expired. Command ignored.`);
                    return false;
                }
            } catch (err: any) {
                // If license check errors out, default to allowed but log it?
                // Actually, safer to block it if logic fails.
                logger.error(`🚨 [RELAY] LICENSE CHECK FAILED: ${err.message}`);
                return false;
            }
        }

        logger.info(`📡 RELAY: Meja ${channel} → ${command.toUpperCase()}`);
        this.mockStates[channel] = status === 'on';

        try {
            const { getIO } = await import('../../socket');
            const io = getIO();
            if (io) io.emit('relay:command', { channel, status: command });
        } catch (e) { }

        if (!process.env.IS_LOCAL_ELECTRON) return true;

        this.burstAsync(channel, status === 'on').catch(() => {});
        return true;
    }

    static async notifyBlink(channel: number) {
        try {
            const { getIO } = await import('../../socket');
            const io = getIO();
            if (io) io.emit('relay:blink', { channel });
        } catch (e) { }
    }

    private static async burstAsync(channel: number, isOn: boolean): Promise<void> {
        const self = this as any;
        if (this.lock) {
            this.queue.push({ channel, command: isOn ? 'on' : 'off' });
            return;
        }
        this.lock = true;
        this.lockTime = Date.now();
        const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        const writeRaw = (data: string): Promise<void> => {
            return new Promise<void>((resolve) => {
                const sendNow = () => {
                    if (!self.port || !self.port.isOpen) { resolve(); return; }
                    self.port.write(data, (err: any) => {
                        if (err) logger.error(`[RELAY] Write Error: ${err.message}`);
                        setTimeout(resolve, 50);
                    });
                };
                if (!self.port || !self.port.isOpen) { 
                    this.init().then(() => {
                        setTimeout(sendNow, 500); // Tunggu port stabil setelah OPEN
                    });
                    return; 
                }
                sendNow();
            });
        };

        try {
            const cmd = `${channel}${isOn ? '1' : '0'}\r\n`;
            await writeRaw(cmd);
            await delay(100);
            await writeRaw(cmd);
            
            // Extra safety for OFF command
            if (!isOn) {
                await delay(200);
                await writeRaw(cmd);
            }
        } catch (e) {} finally {
            this.lock = false;
            const next = this.queue.shift();
            if (next) setTimeout(() => this.burstAsync(next.channel, next.command === 'on'), 100);
        }
    }

    static async blink(channel: number): Promise<void> {
        this.notifyBlink(channel); // Broadcast to UI/Cloud
        
        if (!process.env.IS_LOCAL_ELECTRON) return;
        
        const originalState = this.mockStates[channel];
        try {
            await this.burstAsync(channel, false);
            await new Promise(r => setTimeout(r, 800));
            await this.burstAsync(channel, true);
            await new Promise(r => setTimeout(r, 800));
            await this.burstAsync(channel, false);
            await new Promise(r => setTimeout(r, 800));
            await this.burstAsync(channel, originalState);
        } catch (e) {}
    }

    private static async updateConnectionStatus(status: boolean) {
        if (this.isConnected !== status) {
            this.isConnected = status;
            eventBus.emit('hardware:status', status);
            logger.info(`📡 [RELAY] Status: ${status ? 'ONLINE' : 'OFFLINE'}`);
        }
    }
}

RelayService.init();
