const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000,
};

const conn = new Client();
console.log(`🚀 Connecting to VPS ${VPS_CONFIG.host} to push latest changes...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected to VPS!');

    try {
        // 1. Pack Backend Source & Dist
        console.log('📦 1. Packing Backend Source & Dist...');
        const backendSrcArchive = path.join(__dirname, 'backend_src.tar.gz');
        const backendDistArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendSrcArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'src')}" .`);
        execSync(`tar -czf "${backendDistArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        // 2. Pack POS Frontend
        console.log('📦 2. Packing POS Frontend...');
        const frontendArchive = path.join(__dirname, 'frontend_dist.tar.gz');
        execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

        // 3. Pack Staff App
        console.log('📦 3. Packing Staff App...');
        const staffArchive = path.join(__dirname, 'staff_dist.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        // 4. SFTP Upload
        console.log('📤 4. Uploading archives to VPS /tmp...');
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                let completed = 0;
                const files = [
                    { local: backendSrcArchive, remote: '/tmp/backend_src.tar.gz' },
                    { local: backendDistArchive, remote: '/tmp/backend_dist.tar.gz' },
                    { local: frontendArchive, remote: '/tmp/frontend_dist.tar.gz' },
                    { local: staffArchive, remote: '/tmp/staff_dist.tar.gz' }
                ];

                files.forEach(f => {
                    console.log(`   Uploading ${path.basename(f.local)}...`);
                    sftp.fastPut(f.local, f.remote, (err) => {
                        if (err) return reject(err);
                        console.log(`   ✅ ${path.basename(f.local)} uploaded!`);
                        completed++;
                        if (completed === files.length) resolve();
                    });
                });
            });
        });

        // 5. Remote Extraction & Restart
        console.log('\n🚀 5. Extracting on VPS and reloading services...');
        const remoteCmd = `
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

            echo "--- Updating Backend Source & Dist ---"
            mkdir -p /var/www/vamos/vamos-pos-backend/src
            tar -xzf /tmp/backend_src.tar.gz -C /var/www/vamos/vamos-pos-backend/src
            rm -f /tmp/backend_src.tar.gz

            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz

            echo "--- Updating POS Frontend ---"
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            tar -xzf /tmp/frontend_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/frontend_dist.tar.gz

            echo "--- Updating Staff Web App ---"
            mkdir -p /var/www/vamos/vamos-staff-app/dist
            tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-staff-app/dist
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            cp -r /var/www/vamos/vamos-staff-app/dist/* /var/www/vamos/vamos-pos-frontend/dist/staff/
            rm -f /tmp/staff_dist.tar.gz

            echo "--- Reloading Nginx ---"
            systemctl reload nginx || true

            echo "--- Restarting PM2 Backend ---"
            pm2 restart vamos-backend || pm2 restart vamos-pos-backend || pm2 restart all

            echo "--- Checking PM2 Status ---"
            pm2 status
            
            echo "🎉 VPS DEPLOYMENT COMPLETED SUCCESSFULLY!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                [backendSrcArchive, backendDistArchive, frontendArchive, staffArchive].forEach(f => {
                    if (fs.existsSync(f)) fs.unlinkSync(f);
                });
                console.log(`\n✅ Remote deploy finished with code: ${code}`);
                conn.end();
            });
        });

    } catch (e) {
        console.error('❌ Deployment error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
