const { SerialPort } = require('serialport');

const port = new SerialPort({
    path: 'COM3',
    baudRate: 9600,
    autoOpen: false
});

console.log('Menghubungkan ke COM3 untuk Uji Paksa LCUS (Hex)...');

port.open((err) => {
    if (err) {
        return console.log('Gagal membuka port: ', err.message);
    }

    console.log('Port Terbuka! MENGIRIM KODE LCUS RELAY...');

    // Meja 8
    const channel = 8;

    // ON Command for LCUS: A0 [Ch] 01 [Chk]
    const onBuffer = Buffer.from([
        0xA0,
        channel,
        0x01,
        (0xA0 + channel + 0x01) & 0xFF
    ]);

    // OFF Command for LCUS: A0 [Ch] 00 [Chk]
    const offBuffer = Buffer.from([
        0xA0,
        channel,
        0x00,
        (0xA0 + channel + 0x00) & 0xFF
    ]);

    console.log('Test ON (Heksadesimal A0): ', onBuffer);
    port.write(onBuffer, () => {
        console.log('Sinyal ON Meja 8 Terkirim! \nSilakan cek apakah lampu nyala...');

        setTimeout(() => {
            console.log('\nSekarang mengirim Test OFF (Heksadesimal A0): ', offBuffer);
            port.write(offBuffer, () => {
                console.log('Sinyal OFF Meja 8 Terkirim!');
                setTimeout(() => port.close(), 1000);
            });
        }, 5000); // Wait 5 seconds before turning off
    });
});
