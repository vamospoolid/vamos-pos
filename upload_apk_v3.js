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

// ✅ APK TERBARU - VamosPlayer.apk (12.12MB) - versi terbaru dengan semua fitur
const localApk = path.join(__dirname, 'vamos-player-app', 'VamosPlayer.apk');
const remoteApk = '/var/www/vamos/vamos-player-app/dist/VamosPlayer.apk';  // path aktif yg di-serve nginx
const remotePublic = '/var/www/vamos/vamos-player-app/public/VamosPlayer.apk';
const remoteBackup = '/var/www/vamos/VamosPlayer.apk';

if (!fs.existsSync(localApk)) {
    console.error(`❌ File tidak ditemukan: ${localApk}`);
    process.exit(1);
}

const fileSizeMB = (fs.statSync(localApk).size / 1024 / 1024).toFixed(2);
console.log(`📦 File  : ${localApk}`);
console.log(`📏 Size  : ${fileSizeMB} MB`);
console.log(`🎯 Target: ${remoteApk}`);
console.log('');

conn.on('ready', () => {
    console.log('✅ SSH Connected!\n');
    console.log(`⬆️  Uploading ${fileSizeMB}MB APK ke server...`);

    conn.sftp((err, sftp) => {
        if (err) throw err;

        const start = Date.now();
        let lastProgress = 0;

        const writeStream = sftp.createWriteStream(remoteApk);
        const readStream = fs.createReadStream(localApk);
        const totalSize = fs.statSync(localApk).size;
        let uploaded = 0;

        readStream.on('data', (chunk) => {
            uploaded += chunk.length;
            const progress = Math.floor((uploaded / totalSize) * 100);
            if (progress !== lastProgress && progress % 10 === 0) {
                process.stdout.write(`\r   ${progress}% — ${(uploaded / 1024 / 1024).toFixed(1)}MB / ${fileSizeMB}MB`);
                lastProgress = progress;
            }
        });

        writeStream.on('close', () => {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            console.log(`\n\n✅ Upload selesai! (${elapsed}s)`);

            // Copy ke semua lokasi yang diketahui
            const copyCmd = [
                `cp ${remoteApk} ${remotePublic} 2>/dev/null && echo "OK: copied ke public" || echo "SKIP public"`,
                `cp ${remoteApk} ${remoteBackup} 2>/dev/null && echo "OK: copied ke root backup" || echo "SKIP backup"`,
                `echo "--- Verifikasi Ukuran ---"`,
                `ls -lh /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk`,
                `ls -lh /var/www/vamos/vamos-player-app/public/VamosPlayer.apk 2>/dev/null || echo "(no public copy)"`,
                `echo "--- HTTP Header Check ---"`,
                `curl -s -I https://app.vamospool.id/VamosPlayer.apk`,
            ].join(' && ');

            conn.exec(copyCmd, (err, stream) => {
                if (err) { conn.end(); return; }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n🚀 DONE! APK terbaru tersedia di:');
                    console.log('   https://app.vamospool.id/VamosPlayer.apk');
                    conn.end();
                });
            });
        });

        writeStream.on('error', (err) => {
            console.error('\n❌ Upload error:', err.message);
            conn.end();
        });

        readStream.pipe(writeStream);
    });
}).connect(config);
