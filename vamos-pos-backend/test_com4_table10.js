/**
 * TEST COM4 - NYALAKAN LAMPU MEJA 10
 * ─────────────────────────────────────────────────────
 * Protocol: STRING ASCII (sama seperti relay.service.ts)
 * Format  : "<channel><state>\r\n"
 *   ON  → "101\r\n"  (meja 10, state 1)
 *   OFF → "100\r\n"  (meja 10, state 0)
 * ─────────────────────────────────────────────────────
 * Jalankan: node test_com4_table10.js
 */
const { SerialPort } = require('serialport');

const COM_PORT = 'COM4';
const TABLE_CHANNEL = 10; // Meja 10 = Channel 10

// ✅ Format string ASCII persis seperti relay.service.ts
const onCmd  = `${TABLE_CHANNEL}1\r\n`;  // "101\r\n"
const offCmd = `${TABLE_CHANNEL}0\r\n`;  // "100\r\n"

console.log('='.repeat(50));
console.log('  TEST COM4 - LAMPU MEJA 10 (STRING ASCII)');
console.log('='.repeat(50));
console.log(`Port      : ${COM_PORT}`);
console.log(`Channel   : ${TABLE_CHANNEL}`);
console.log(`ON  CMD   : ${JSON.stringify(onCmd)}   (raw bytes: ${Buffer.from(onCmd).toString('hex').toUpperCase().replace(/../g, '$& ').trim()})`);
console.log(`OFF CMD   : ${JSON.stringify(offCmd)}  (raw bytes: ${Buffer.from(offCmd).toString('hex').toUpperCase().replace(/../g, '$& ').trim()})`);
console.log('='.repeat(50));

const port = new SerialPort({ path: COM_PORT, baudRate: 9600, autoOpen: false });

port.open((err) => {
    if (err) {
        console.error(`\n❌ GAGAL membuka ${COM_PORT}: ${err.message}`);
        console.log('\n💡 Tips:\n  - Pastikan relay USB terpasang\n  - Cek Device Manager apakah COM4 tersedia');
        process.exit(1);
    }

    console.log(`\n✅ ${COM_PORT} TERBUKA!`);
    console.log(`\n💡 Mengirim ON Meja 10... → "${onCmd.trim()}"`);

    // Kirim 2x (sama persis seperti burstAsync di relay.service.ts)
    port.write(onCmd, (err) => {
        if (err) { console.error('❌ Gagal kirim ON (1):', err.message); port.close(); return; }
        setTimeout(() => {
            port.write(onCmd, (err) => {
                if (err) { console.error('❌ Gagal kirim ON (2):', err.message); port.close(); return; }
                console.log('✅ Sinyal ON Meja 10 TERKIRIM (2x)! Lampu seharusnya MENYALA sekarang.');
                console.log('\n⏳ Menunggu 8 detik sebelum mematikan...\n');

                setTimeout(() => {
                    console.log(`💡 Mengirim OFF Meja 10... → "${offCmd.trim()}"`);
                    port.write(offCmd, (err) => {
                        if (err) { console.error('❌ Gagal kirim OFF (1):', err.message); }
                        setTimeout(() => {
                            port.write(offCmd, (err) => {
                                if (err) { console.error('❌ Gagal kirim OFF (2):', err.message); }
                                else { console.log('✅ Sinyal OFF Meja 10 TERKIRIM (2x)! Lampu seharusnya MATI.'); }
                                setTimeout(() => {
                                    port.close();
                                    console.log('\n✅ Port ditutup. Test selesai!');
                                }, 300);
                            });
                        }, 50);
                    });
                }, 8000);
            });
        }, 50);
    });
});
