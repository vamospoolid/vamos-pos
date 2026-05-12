const { SerialPort } = require('serialport');

async function diagnose() {
    console.log('======================================================');
    console.log('VAMOS POS - HARDWARE DIAGNOSTIC TOOL');
    console.log('======================================================\n');

    try {
        const ports = await SerialPort.list();
        
        if (ports.length === 0) {
            console.log('❌ TIDAK ADA PORT SERIAL TERDETEKSI.');
            console.log('Pastikan USB Relay sudah terpasang dan Driver CH340 sudah terinstall.\n');
            return;
        }

        console.log(`Terdeteksi ${ports.length} port serial:\n`);
        
        let foundRelay = null;

        for (const port of ports) {
            const isCH340 = port.vendorId?.toLowerCase() === '1a86' || port.manufacturer?.toLowerCase().includes('wch');
            const status = isCH340 ? '[RELAY POTENSIAL]' : '[PORT LAIN]';
            
            console.log(`${status} ${port.path}`);
            console.log(`   - Manufacturer: ${port.manufacturer || 'Unknown'}`);
            console.log(`   - Vendor ID:   ${port.vendorId || 'N/A'}`);
            console.log(`   - Product ID:  ${port.productId || 'N/A'}`);
            
            if (isCH340) foundRelay = port.path;

            // Try to open it
            try {
                const testPort = new SerialPort({ path: port.path, baudRate: 9600, autoOpen: false });
                await new Promise((resolve) => {
                    testPort.open((err) => {
                        if (err) {
                            console.log(`   - Status:      ❌ SIBUK (Mungkin sedang dipakai aplikasi lain)`);
                            resolve();
                        } else {
                            console.log(`   - Status:      ✅ TERSEDIA`);
                            testPort.close(() => resolve());
                        }
                    });
                });
            } catch (e) {
                console.log(`   - Status:      ❌ ERROR`);
            }
            console.log('');
        }

        console.log('------------------------------------------------------');
        if (foundRelay) {
            console.log(`✅ SARAN: Gunakan port ${foundRelay} di file .env`);
            console.log(`Atau set RELAY_COM_PORT=AUTO agar aplikasi mencari otomatis.`);
        } else {
            console.log('❌ RELAY CH340 TIDAK DITEMUKAN.');
            console.log('Coba cabut dan pasang kembali USB Relay di port USB yang berbeda.');
        }
        console.log('------------------------------------------------------\n');

    } catch (err) {
        console.error('Terjadi kesalahan saat scan:', err.message);
    }
}

diagnose().then(() => {
    console.log('Tekan tombol apa saja untuk keluar...');
});
