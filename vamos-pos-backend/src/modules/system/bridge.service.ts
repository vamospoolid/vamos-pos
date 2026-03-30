import { io } from 'socket.io-client';
import { RelayService } from '../relay/relay.service';
import { logger } from '../../utils/logger';

export class BridgeService {
    private static client: any = null;

    static init() {
        if (this.client) return;

        // Bridge mode only if local
        if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON) {
            return;
        }

        const serverUrl = process.env.BRIDGE_SERVER_URL || 'https://pos.vamospool.id';
        logger.info(`🌉 BRIDGING: Connecting to VPS Socket at ${serverUrl}...`);

        this.client = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true
        });

        this.client.on('connect', () => {
            logger.info('🛰️ BRIDGE CONNECTED: Tuning into cloud signal.');
        });

        this.client.on('disconnect', () => {
            logger.warn('🛰️ BRIDGE DISCONNECTED: Cloud signal lost.');
        });

        // Listen for relay commands from the VPS
        this.client.on('relay:command', async (data: { channel: number; status: 'on' | 'off' }) => {
            logger.info(`📥 BRIDGE RECEIVE: Turning Table ${data.channel} ${data.status.toUpperCase()}`);
            try {
                // Execute on local physical relay
                await RelayService.sendCommand(data.channel, data.status);
            } catch (err: any) {
                logger.error(`🚨 BRIDGE RELAY ERROR: ${err.message}`);
            }
        });

        // Listen for Real-time Port Configuration update
        this.client.on('relay:config:update', async (data: { port: string }) => {
            logger.info(`🔄 BRIDGE CONFIG: Switching relay port to ${data.port}...`);
            try {
                // Force re-initialization with the new port from UI
                await RelayService.init(data.port);
            } catch (err: any) {
                logger.error(`🚨 BRIDGE CONFIG ERROR: ${err.message}`);
            }
        });

        // Listen for license sync from Cloud to persist offline
        this.client.on('license:sync', async (data: any) => {
            if (data.isActivated && data.license) {
                logger.info(`📡 BRIDGE LICENSE: Syncing activation to local DB.`);
                try {
                    const { prisma } = await import('../../database/db');
                    await prisma.license.upsert({
                        where: { hardwareId: data.machineId },
                        update: {
                            isActivated: true,
                            activatedAt: data.license.activatedAt,
                            expiresAt: data.license.expiresAt,
                            licenseKey: data.license.licenseKey,
                            isActive: data.license.isActive
                        },
                        create: {
                            hardwareId: data.machineId,
                            isActivated: true,
                            activatedAt: data.license.activatedAt,
                            expiresAt: data.license.expiresAt,
                            licenseKey: data.license.licenseKey,
                            isActive: data.license.isActive
                        }
                    });
                } catch (e: any) {
                    logger.error(`🚨 BRIDGE LICENSE ERROR: ${e.message}`);
                }
            }
        });
    }
}

// Auto-init if enabled
if (process.env.ENABLE_BRIDGE === 'true') {
    BridgeService.init();
}
