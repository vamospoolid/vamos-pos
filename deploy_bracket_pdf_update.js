const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS 173.212.243.240!\n');

    async function deploy() {
        // 1. Deploy POS Frontend dist
        console.log('📦 1. Packing & Deploying POS Frontend...');
        const posLocalDist = path.join(__dirname, 'vamos-pos-frontend', 'dist');
        const posArchive = path.join(__dirname, 'pos_frontend.tar.gz');
        execSync(`tar -czf "${posArchive}" -C "${posLocalDist}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(posArchive, '/tmp/pos_frontend.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 2. Deploy Admin Frontend dist
        console.log('📦 2. Packing & Deploying Admin Frontend...');
        const adminLocalDist = path.join(__dirname, 'vamos-admin-app', 'dist');
        const adminArchive = path.join(__dirname, 'admin_frontend.tar.gz');
        execSync(`tar -czf "${adminArchive}" -C "${adminLocalDist}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(adminArchive, '/tmp/admin_frontend.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 3. Extract and reload nginx on VPS
        console.log('🔄 3. Extracting and reloading Nginx on VPS...');
        const remoteCmd = `
            # Backup VamosPlayer.apk if exists
            cp /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk /tmp/VamosPlayer.apk 2>/dev/null || true
            
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            tar -xzf /tmp/pos_frontend.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/pos_frontend.tar.gz

            # Restore APK
            cp /tmp/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk 2>/dev/null || true
            
            # Admin dist
            mkdir -p /var/www/vamos/vamos-admin-app/dist
            tar -xzf /tmp/admin_frontend.tar.gz -C /var/www/vamos/vamos-admin-app/dist
            rm -f /tmp/admin_frontend.tar.gz

            systemctl reload nginx 2>/dev/null || true
            echo "SUCCESS_DEPLOY_FRONTENDS"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                try { fs.unlinkSync(posArchive); } catch(e){}
                try { fs.unlinkSync(adminArchive); } catch(e){}
                console.log('\n🎉 Selesai deploy POS Frontend & Admin Frontend ke VPS!');
                conn.end();
            });
        });
    }

    deploy().catch(err => {
        console.error('Deploy error:', err);
        conn.end();
    });
}).connect(config);
