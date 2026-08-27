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

        // 2. Deploy Backend dist
        console.log('📦 2. Packing & Deploying POS Backend...');
        const backendLocalDist = path.join(__dirname, 'vamos-pos-backend', 'dist');
        const backendArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendArchive}" -C "${backendLocalDist}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(backendArchive, '/tmp/backend_dist.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 3. Extract and restart on VPS
        console.log('🔄 3. Extracting and restarting on VPS...');
        const remoteCmd = `
            # Backup VamosPlayer.apk if exists
            cp /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk /tmp/VamosPlayer.apk 2>/dev/null || true
            
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            tar -xzf /tmp/pos_frontend.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/pos_frontend.tar.gz

            # Restore APK
            cp /tmp/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk 2>/dev/null || true
            
            # Backend dist
            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz

            # Restart backend
            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            pm2 restart all || pm2 restart vamos-backend || true
            systemctl reload nginx 2>/dev/null || true
            echo "SUCCESS_DEPLOY_COMPETITION"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                // Cleanup local archives
                try { fs.unlinkSync(posArchive); } catch(e){}
                try { fs.unlinkSync(backendArchive); } catch(e){}
                console.log('\n🎉 Selesai deploy POS Frontend & Backend ke VPS!');
                conn.end();
            });
        });
    }

    deploy().catch(err => {
        console.error('Deploy error:', err);
        conn.end();
    });
}).connect(config);
