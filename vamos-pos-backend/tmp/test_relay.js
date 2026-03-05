const { RelayService } = require('../src/modules/relay/relay.service');

async function test() {
    console.log('Initializing Relay Service...');
    // We might need to wait for init to complete, but it's called on import
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Sending ON to Channel 7...');
    await RelayService.sendCommand(7, 'on');

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Check logs above for any errors');
    process.exit(0);
}

test();
