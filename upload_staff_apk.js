const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const apkPath = path.join(__dirname, 'VamosStaff.apk');

if (!fs.existsSync(apkPath)) {
    console.error('❌ File VamosStaff.apk tidak ditemukan!');
    process.exit(1);
}

const stats = fs.statSync(apkPath);
console.log(`📦 Mengupload VamosStaff.apk (${(stats.size / 1024 / 1024).toFixed(2)} MB) ke VPS...`);

const conn = new Client();
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const remoteDist = '/var/www/vamos/vamos-pos-frontend/dist/VamosStaff.apk';
        const remoteRoot = '/var/www/vamos/VamosStaff.apk';
        console.log(`📤 Streaming ${apkPath} ke ${remoteDist}...`);

        const readStream = fs.createReadStream(apkPath);
        const writeStream = sftp.createWriteStream(remoteDist);

        readStream.pipe(writeStream);

        writeStream.on('close', () => {
            console.log('✅ Upload ke dist selesai!');
            conn.exec(`cp ${remoteDist} ${remoteRoot} && chmod 644 ${remoteDist} ${remoteRoot}`, (err, stream) => {
                if (err) { conn.end(); return; }
                stream.on('close', () => {
                    console.log('✅ Upload ke root vamos selesai!');
                    console.log('🎉 APK Staf dapat diunduh di: https://pos.vamospool.id/VamosStaff.apk');
                    conn.end();
                });
            });
        });

        writeStream.on('error', (err) => {
            console.error('❌ Upload error:', err);
            conn.end();
        });
    });
}).connect(config);
