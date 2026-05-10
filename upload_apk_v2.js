const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07',
    // Increase keepalive to prevent connection drops during large uploads
    keepaliveInterval: 5000,
    keepaliveCountMax: 20,
    readyTimeout: 60000
};

const localApk = 'd:\\APPS\\vamosmobile\\VamosPlayer_v4_Booking.apk';
const remoteApk = '/var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk';

conn.on('ready', () => {
    console.log('✅ SSH Connected!\n');
    console.log(`📦 Uploading ${(fs.statSync(localApk).size / 1024 / 1024).toFixed(1)}MB APK...`);

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
                console.log(`   ${progress}% - ${(uploaded / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
                lastProgress = progress;
            }
        });

        writeStream.on('close', () => {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            console.log(`\n✅ APK uploaded! (${elapsed}s)`);
            
            // Also backup to root dir
            conn.exec(`cp ${remoteApk} /var/www/vamos-pos/vamos-player-app/VamosPlayer.apk && echo "Backup created"`, (err, stream) => {
                if (err) { conn.end(); return; }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('🚀 Done! APK tersedia di https://app.vamospool.id/VamosPlayer.apk');
                    conn.end();
                });
            });
        });

        writeStream.on('error', (err) => {
            console.error('❌ Upload error:', err.message);
            conn.end();
        });

        readStream.pipe(writeStream);
    });
}).connect(config);
