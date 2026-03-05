import { RelayService } from '../src/modules/relay/relay.service';
import { logger } from '../src/utils/logger';

async function test() {
    logger.info('Initializing Relay Service test...');
    await RelayService.init();
    await new Promise(resolve => setTimeout(resolve, 3000));

    const status = RelayService.getStatus();
    logger.info(`Relay Status: ${JSON.stringify(status)}`);

    logger.info('Sending ON to Channel 7...');
    const result = await RelayService.sendCommand(7, 'on');
    logger.info(`Send command result: ${result}`);

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for burst to finish
    logger.info('Test completed');
    process.exit(0);
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
