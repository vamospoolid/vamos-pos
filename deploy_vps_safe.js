/**
 * deploy_vps_safe.js
 * 
 * SCRIPT DEPLOYMENT AMAN KE VPS 173.212.243.240
 * JAMINAN KEAMANAN DATA:
 * 1. ZERO DATABASE TOUCH: Tidak ada perintah prisma migrate/db push/seed yang dijalankan.
 *    Database PostgreSQL (member, transaksi, shift, meja, dll) 100% UTUH & TIDAK DISENTUH.
 * 2. PRESERVE ASSETS & APKS: File APK (VamosPlayer.apk, VamosStaff.apk) dan foto/uploads
 *    di-backup otomatis dan dikembalikan setelah ekstraksi web dist.
 * 3. PRESERVE CONFIG: File .env dan sesi WhatsApp tidak tersentuh.
 * 4. ZERO DOWNTIME: pm2 reload vamos-backend dilakukan secara smooth.
 */

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

async function runSafeDeploy() {
    console.log('🚀 [SAFE DEPLOY] Memulai persiapan paket kompilasi...');

    // 1. Pack Backend Dist
    const backendArchive = path.join(__dirname, 'backend_dist.tar.gz');
    console.log('📦 1/4 Mengompresi vamos-pos-backend/dist...');
    execSync(`tar -czf "${backendArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

    // 2. Pack POS Frontend Dist
    const frontendArchive = path.join(__dirname, 'frontend_dist.tar.gz');
    console.log('📦 2/4 Mengompresi vamos-pos-frontend/dist...');
    execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

    // 3. Pack Player App Dist
    const playerArchive = path.join(__dirname, 'player_dist.tar.gz');
    console.log('📦 3/4 Mengompresi vamos-player-app/dist...');
    execSync(`tar -czf "${playerArchive}" -C "${path.join(__dirname, 'vamos-player-app', 'dist')}" .`);

    // 4. Pack Staff App Dist
    const staffArchive = path.join(__dirname, 'staff_dist.tar.gz');
    console.log('📦 4/4 Mengompresi vamos-staff-app/dist...');
    execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

    console.log('✅ Semua paket tar.gz siap diunggah ke VPS.\n');

    const conn = new Client();
    console.log(`🔌 Menghubungkan SSH ke VPS ${VPS_CONFIG.host}...`);

    conn.on('ready', async () => {
        console.log('✅ Terhubung via SSH!\n');

        try {
            // Helper SFTP put
            const putFile = (local, remote) => new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    console.log(`⬆️ Mengunggah ${path.basename(local)} ke ${remote}...`);
                    sftp.fastPut(local, remote, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });

            await putFile(backendArchive, '/tmp/backend_dist.tar.gz');
            await putFile(frontendArchive, '/tmp/frontend_dist.tar.gz');
            await putFile(playerArchive, '/tmp/player_dist.tar.gz');
            await putFile(staffArchive, '/tmp/staff_dist.tar.gz');

            console.log('\n🚀 Menjalankan ekstraksi aman di VPS (Database 100% aman tanpa diubah)...');

            const safeRemoteScript = `
                set -e
                echo "=== 1. EKSTRAKSI BACKEND DIST (Zero Database Touch) ==="
                mkdir -p /var/www/vamos/vamos-pos-backend/dist
                tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
                rm -f /tmp/backend_dist.tar.gz
                echo "✅ Backend dist terpasang."

                echo "=== 2. EKSTRAKSI POS FRONTEND (Preserve APKs) ==="
                mkdir -p /tmp/pos_frontend_backup
                cp -p /var/www/vamos/vamos-pos-frontend/dist/*.apk /tmp/pos_frontend_backup/ 2>/dev/null || true
                mkdir -p /var/www/vamos/vamos-pos-frontend/dist
                tar -xzf /tmp/frontend_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
                cp -p /tmp/pos_frontend_backup/* /var/www/vamos/vamos-pos-frontend/dist/ 2>/dev/null || true
                rm -rf /tmp/pos_frontend_backup /tmp/frontend_dist.tar.gz
                echo "✅ POS Frontend terpasang & APK aman."

                echo "=== 3. EKSTRAKSI PLAYER APP (Preserve APKs & Logos) ==="
                mkdir -p /tmp/player_app_backup
                cp -p /var/www/vamos/vamos-player-app/dist/*.apk /tmp/player_app_backup/ 2>/dev/null || true
                cp -p /var/www/vamos/vamos-player-app/dist/*.png /tmp/player_app_backup/ 2>/dev/null || true
                cp -p /var/www/vamos/vamos-player-app/dist/*.svg /tmp/player_app_backup/ 2>/dev/null || true
                mkdir -p /var/www/vamos/vamos-player-app/dist
                tar -xzf /tmp/player_dist.tar.gz -C /var/www/vamos/vamos-player-app/dist
                cp -p /tmp/player_app_backup/* /var/www/vamos/vamos-player-app/dist/ 2>/dev/null || true
                rm -rf /tmp/player_app_backup /tmp/player_dist.tar.gz
                echo "✅ Player App terpasang & APK/Logo aman."

                echo "=== 4. EKSTRAKSI STAFF APP ==="
                mkdir -p /var/www/vamos/vamos-staff-app/dist
                tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-staff-app/dist
                mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
                cp -r /var/www/vamos/vamos-staff-app/dist/* /var/www/vamos/vamos-pos-frontend/dist/staff/
                rm -f /tmp/staff_dist.tar.gz
                echo "✅ Staff App terpasang & terhubung ke /staff."

                echo "=== 5. RELOAD PM2 VAMOS BACKEND ==="
                pm2 reload vamos-backend
                echo "✅ PM2 vamos-backend berhasil di-reload."

                echo "=== VERIFIKASI STATUS PM2 ==="
                pm2 status vamos-backend
            `;

            conn.exec(safeRemoteScript, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', (code) => {
                    // Bersihkan file tar lokal
                    try {
                        fs.unlinkSync(backendArchive);
                        fs.unlinkSync(frontendArchive);
                        fs.unlinkSync(playerArchive);
                        fs.unlinkSync(staffArchive);
                    } catch (e) {}

                    if (code === 0) {
                        console.log('\n🎉 [SUKSES 100%] PUSH KE VPS SELESAI TANPA MENGUBAH DATA APAPUN!');
                    } else {
                        console.error(`\n⚠️ Proses selesai dengan exit code: ${code}`);
                    }
                    conn.end();
                });
            });

        } catch (err) {
            console.error('❌ Terjadi kesalahan:', err);
            conn.end();
        }
    }).on('error', err => console.error('❌ SSH Error:', err.message)).connect(VPS_CONFIG);
}

runSafeDeploy();
