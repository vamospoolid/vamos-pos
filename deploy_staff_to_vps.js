const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const conn = new Client();
console.log('🚀 Menghubungkan ke VPS 173.212.243.240...');

conn.on('ready', async () => {
    console.log('✅ SSH Terhubung!');
    try {
        // 1. Pack Staff App Web Dist
        console.log('📦 1. Mengemas Staff App Web Dist...');
        const staffArchive = path.join(__dirname, 'staff_dist_latest.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(staffArchive, '/tmp/staff_dist_latest.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 2. Upload VamosStaff.apk
        let localApk = path.join(__dirname, 'VamosStaff.apk');
        if (!fs.existsSync(localApk)) {
            localApk = path.join(__dirname, 'vamos-staff-app', 'VamosStaff.apk');
        }
        if (fs.existsSync(localApk)) {
            const stats = fs.statSync(localApk);
            console.log(`📦 2. Mengupload VamosStaff.apk (${(stats.size / 1024 / 1024).toFixed(2)} MB) ke VPS...`);
            await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    sftp.fastPut(localApk, '/var/www/vamos/vamos-pos-frontend/dist/VamosStaff.apk', (err) => {
                        if (err) return reject(err);
                        console.log('✅ VamosStaff.apk berhasil diupload ke /var/www/vamos/vamos-pos-frontend/dist/VamosStaff.apk');
                        resolve();
                    });
                });
            });
        }

        // 3. Extract Web Dist on Remote VPS
        console.log('🚀 3. Mengekstrak Staff App di VPS Nginx...');
        const remoteCmd = `
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -rf /var/www/vamos/vamos-pos-frontend/dist/staff/*
            tar -xzf /tmp/staff_dist_latest.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -f /tmp/staff_dist_latest.tar.gz

            mkdir -p /var/www/vamos/vamos-staff-app/dist
            rm -rf /var/www/vamos/vamos-staff-app/dist/*
            cp -r /var/www/vamos/vamos-pos-frontend/dist/staff/* /var/www/vamos/vamos-staff-app/dist/ 2>/dev/null || true

            ls -lh /var/www/vamos/vamos-pos-frontend/dist/VamosStaff.apk
            echo "🎉 DEPLOY STAFF APP & APK KE VPS SUKSES 100%!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log('✅ Deployment selesai dengan sempurna.');
                if (fs.existsSync(staffArchive)) fs.unlinkSync(staffArchive);
                conn.end();
            });
        });

    } catch (err) {
        console.error('❌ Error saat deploy:', err);
        conn.end();
    }
}).connect(VPS_CONFIG);
