/**
 * TEST SEMUA 10 CHANNEL RELAY (LCUS Protocol)
 * Nyalakan satu per satu channel 1-10, kemudian matikan semua.
 * Jalankan: node test_all_relay.js
 */
const { SerialPort } = require('serialport');

const COM_PORT = process.argv[2] || 'COM3';
const DELAY_ON  = 1500;  // ms lampu ON sebelum pindah ke channel berikutnya
const DELAY_OFF = 500;   // ms jeda antar matikan

function buildCmd(channel, on) {
    const state = on ? 0x01 : 0x00;
    const checksum = (0xA0 + channel + state) & 0xFF;
    return Buffer.from([0xA0, channel, state, checksum]);
}

const port = new SerialPort({ path: COM_PORT, baudRate: 9600, autoOpen: false });

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function send(buf) {
    return new Promise((resolve, reject) => {
        port.write(buf, err => err ? reject(err) : resolve());
    });
}

async function run() {
    await new Promise((res, rej) => port.open(e => e ? rej(e) : res()));
    console.log(`\n✅ Port ${COM_PORT} terbuka. Memulai tes 10 channel...\n`);

    // Pastikan semua mati dulu
    console.log('🔴 Reset: Matikan semua channel (1-10)...');
    for (let ch = 1; ch <= 10; ch++) {
        await send(buildCmd(ch, false));
        await delay(100);
    }
    await delay(500);

    // Nyalakan satu per satu
    for (let ch = 1; ch <= 10; ch++) {
        const hex = buildCmd(ch, true).toString('hex').toUpperCase().replace(/../g, '$& ').trim();
        console.log(`✅ Meja ${ch.toString().padStart(2,'0')} ON  → HEX: [${hex}]`);
        await send(buildCmd(ch, true));
        await delay(DELAY_ON);

        const hexOff = buildCmd(ch, false).toString('hex').toUpperCase().replace(/../g, '$& ').trim();
        console.log(`🔴 Meja ${ch.toString().padStart(2,'0')} OFF → HEX: [${hexOff}]`);
        await send(buildCmd(ch, false));
        await delay(DELAY_OFF);
    }

    console.log('\n🎉 Semua 10 channel berhasil diuji!');
    console.log('Tabel HEX Command LCUS:\n');
    console.log('Ch | ON Command         | OFF Command');
    console.log('---|--------------------|-----------------');
    for (let ch = 1; ch <= 10; ch++) {
        const on  = buildCmd(ch, true).toString('hex').toUpperCase().replace(/../g, '$& ').trim();
        const off = buildCmd(ch, false).toString('hex').toUpperCase().replace(/../g, '$& ').trim();
        console.log(` ${ch.toString().padStart(2,'0')} | [${on}]     | [${off}]`);
    }

    port.close();
}

run().catch(err => {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
});
