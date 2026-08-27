const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    keepaliveInterval: 5000,
    keepaliveCountMax: 20,
    readyTimeout: 60000
};

const localApk = path.join(__dirname, 'vamos-player-app', 'VamosPlayer.apk');

if (!fs.existsSync(localApk)) {
    console.error(`❌ File APK lokal tidak ditemukan: ${localApk}`);
    process.exit(1);
}

const stats = fs.statSync(localApk);
const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`====================================================`);
console.log(`📦 FRESH NEW APK : ${localApk}`);
console.log(`📏 FILE SIZE     : ${stats.size} bytes (${fileSizeMB} MB)`);
console.log(`⏰ LAST MODIFIED : ${stats.mtime.toLocaleString('id-ID')}`);
console.log(`====================================================\n`);

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS 173.212.243.240!\n');

    // 1. Bersihkan APK lama di semua direktori
    const cleanCmd = `
        echo "[1/4] Menghapus APK lama di seluruh server..."
        rm -f /var/www/vamos/vamos-player-app/dist/*.apk
        rm -f /var/www/vamos/vamos-player-app/public/*.apk
        rm -f /var/www/vamos/vamos-pos-frontend/dist/*.apk
        rm -f /var/www/vamos/vamos-pos-backend/public/*.apk
        rm -f /var/www/vamos-pos/vamos-player-app/dist/*.apk 2>/dev/null
        rm -f /var/www/vamos-pos/vamos-player-app/public/*.apk 2>/dev/null
        rm -f /var/www/vamos-pos/vamos-pos-frontend/dist/*.apk 2>/dev/null
        rm -f /var/www/vamos-pos/vamos-pos-backend/public/*.apk 2>/dev/null
        echo "✅ APK lama berhasil dibersihkan."
    `;

    conn.exec(cleanCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            // 2. Upload APK baru via SFTP
            console.log(`\n[2/4] Mengupload APK baru (${fileSizeMB} MB) ke VPS...`);
            conn.sftp((err, sftp) => {
                if (err) throw err;

                const remotePrimary = '/var/www/vamos/vamos-player-app/dist/VamosPlayer.apk';
                const readStream = fs.createReadStream(localApk);
                const writeStream = sftp.createWriteStream(remotePrimary);

                let uploaded = 0;
                let lastPct = 0;
                readStream.on('data', chunk => {
                    uploaded += chunk.length;
                    const pct = Math.floor((uploaded / stats.size) * 100);
                    if (pct !== lastPct && pct % 10 === 0) {
                        process.stdout.write(`\r   Progress: ${pct}% (${(uploaded / 1024 / 1024).toFixed(1)}MB / ${fileSizeMB}MB)`);
                        lastPct = pct;
                    }
                });

                writeStream.on('close', () => {
                    console.log(`\n✅ Upload selesai ke ${remotePrimary}`);

                    // 3. Gandakan ke semua target download dan sinkronisasi Nginx
                    console.log(`\n[3/4] Mendistribusikan APK ke semua path download & restart Nginx...`);
                    const syncCmd = `
                        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-player-app/public/VamosPlayer.apk
                        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk
                        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-pos-backend/public/VamosPlayer.apk
                        
                        # Buat juga versi lowercase jika ada user/link yang minta lowercase
                        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-player-app/dist/vamosplayer.apk
                        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/vamosplayer.apk
                        
                        # Cek file yang sudah tersimpan
                        echo "--- List File APK di Server ---"
                        ls -lh /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk
                        ls -lh /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk
                        ls -lh /var/www/vamos/vamos-pos-backend/public/VamosPlayer.apk
                        
                        # Restart Nginx
                        systemctl reload nginx || systemctl restart nginx
                        echo "✅ Nginx reloaded."
                    `;

                    conn.exec(syncCmd, (err, stream2) => {
                        if (err) throw err;
                        stream2.on('data', d => process.stdout.write(d.toString()));
                        stream2.on('close', () => {
                            // 4. Verifikasi setiap Link Download APK
                            console.log(`\n[4/4] Verifikasi link download APK via HTTP...`);
                            const verifyCmd = `
                                echo "=== TEST 1: https://app.vamospool.id/VamosPlayer.apk ==="
                                curl -s -I https://app.vamospool.id/VamosPlayer.apk | grep -E "HTTP|Content-Length|Content-Type"
                                
                                echo "=== TEST 2: https://pos.vamospool.id/VamosPlayer.apk ==="
                                curl -s -I https://pos.vamospool.id/VamosPlayer.apk | grep -E "HTTP|Content-Length|Content-Type"

                                echo "=== TEST 3: https://app.vamospool.id/vamosplayer.apk ==="
                                curl -s -I https://app.vamospool.id/vamosplayer.apk | grep -E "HTTP|Content-Length|Content-Type"
                            `;

                            conn.exec(verifyCmd, (err, stream3) => {
                                if (err) throw err;
                                stream3.on('data', d => process.stdout.write(d.toString()));
                                stream3.on('close', () => {
                                    console.log('\n🎉 SEMUA APK LAMA TELAH DIHAPUS DAN APK BARU TELAH AKTIF!');
                                    console.log('🔗 Link Download: https://app.vamospool.id/VamosPlayer.apk');
                                    conn.end();
                                });
                            });
                        });
                    });
                });

                writeStream.on('error', err => {
                    console.error('❌ Upload error:', err);
                    conn.end();
                });

                readStream.pipe(writeStream);
            });
        });
    });
}).connect(config);
