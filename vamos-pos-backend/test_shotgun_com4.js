const { SerialPort } = require('serialport');

const COM_PORT = 'COM4';

function calculateModbusCRC(buffer) {
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
    return Buffer.concat([buffer, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]);
}

const port = new SerialPort({ path: COM_PORT, baudRate: 9600, autoOpen: false });

async function play() {
    await new Promise((res, rej) => port.open(e => e ? rej(e) : res()));
    console.log('Port Opened on COM4');

    const ch = 10;
    
    // 1. LCUS HEX (A0 0A 01 AB)
    const lcusOn = Buffer.from([0xA0, ch, 0x01, (0xA0 + ch + 0x01) & 0xFF]);
    console.log('Testing Protocol 1: LCUS HEX', lcusOn);
    port.write(lcusOn);
    await new Promise(r => setTimeout(r, 4000));

    // 2. Modbus RTU (Generic Relay 10 ON)
    const modbusOn = calculateModbusCRC(Buffer.from([0x01, 0x05, 0x00, 0x09, 0xFF, 0x00]));
    console.log('Testing Protocol 2: Modbus RTU', modbusOn);
    port.write(modbusOn);
    await new Promise(r => setTimeout(r, 4000));

    // 3. String ASCII "101\r\n"
    console.log('Testing Protocol 3: String "101\\r\\n"');
    port.write("101\r\n");
    await new Promise(r => setTimeout(r, 4000));

    // 4. String ASCII 2-digit format "0101\r\n"
    console.log('Testing Protocol 4: String "0101\\r\\n"');
    port.write("0101\r\n");
    await new Promise(r => setTimeout(r, 4000));

    // 5. Common Chinese 10-ch board ASCII "M10-ON" or "10-1"
    console.log('Testing Protocol 5: String "10-1\\r\\n"');
    port.write("10-1\r\n");
    await new Promise(r => setTimeout(r, 4000));

    console.log('Semua percobaan selesai dikirim.');
    port.close();
}

play().catch(console.error);
