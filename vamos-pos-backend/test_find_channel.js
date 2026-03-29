const { SerialPort } = require('serialport');

const COM_PORT = 'COM4';

function buildCmd(channel, on) {
    const state = on ? 0x01 : 0x00;
    const checksum = (0xA0 + channel + state) & 0xFF;
    return Buffer.from([0xA0, channel, state, checksum]);
}

const port = new SerialPort({ path: COM_PORT, baudRate: 9600, autoOpen: false });

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

port.open(async (err) => {
    if (err) {
        console.error(`Gagal buka ${COM_PORT}:`, err.message);
        process.exit(1);
    }
    console.log(`Testing all channels on ${COM_PORT}...`);

    for (let ch = 1; ch <= 16; ch++) {
        console.log(`Testing Channel ${ch}...`);
        const on = buildCmd(ch, true);
        const off = buildCmd(ch, false);
        
        port.write(on);
        await delay(2000); // 2 seconds ON
        port.write(off);
        await delay(500);  // Jeda
    }

    console.log('Test selesai.');
    port.close();
});
