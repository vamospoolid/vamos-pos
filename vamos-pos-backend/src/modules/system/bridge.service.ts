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

        // Listen for booking syncs to update local DB (optional but helpful)
        this.client.on('booking:new', (data: any) => {
            logger.info(`📥 BRIDGE SYNC: New booking received from cloud.`);
            // Local DB sync logic can go here if needed
        });
    }
}

// Auto-init if enabled
if (process.env.ENABLE_BRIDGE === 'true') {
    BridgeService.init();
}
