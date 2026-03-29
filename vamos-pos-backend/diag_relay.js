const { SerialPort } = require('serialport');

const port = new SerialPort({
    path: 'COM3',
    baudRate: 9600,
    autoOpen: false
});

async function test() {
    await new Promise((res, rej) => port.open(e => e ? rej(e) : res()));
    console.log('Port Open on COM3');

    const ch = 9;
    
    // Protocol 1: LCUS HEX (A0 09 01 AA)
    const lcusOn = Buffer.from([0xA0, ch, 0x01, (0xA0 + ch + 0x01) & 0xFF]);
    console.log('Sending LCUS HEX for Table 9 ON:', lcusOn);
    port.write(lcusOn);
    
    await new Promise(r => setTimeout(r, 2000));

    // Protocol 2: String ASCII (91\r\n)
    console.log('Sending String "91\\r\\n" for Table 9 ON');
    port.write("91\r\n");

    await new Promise(r => setTimeout(r, 2000));

    // Protocol 3: String ASCII 2-digit (091\r\n)
    console.log('Sending String "091\\r\\n" for Table 9 ON');
    port.write("091\r\n");

    await new Promise(r => setTimeout(r, 2000));
    
    port.close();
    console.log('Test Finished. User: Please check which one made Table 9 turn ON.');
}

test().catch(console.error);
