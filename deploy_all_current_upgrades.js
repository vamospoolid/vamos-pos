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
console.log(`🚀 Connecting to VPS ${VPS_CONFIG.host} to deploy all updates...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');

    try {
        // 1. Pack Backend src and dist
        console.log('📦 Packing Backend (src & dist)...');
        const backendSrcArchive = path.join(__dirname, 'backend_src.tar.gz');
        const backendDistArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendSrcArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'src')}" .`);
        execSync(`tar -czf "${backendDistArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        // 2. Pack POS Frontend dist
        console.log('📦 Packing POS Frontend (dist)...');
        const frontendArchive = path.join(__dirname, 'frontend_dist.tar.gz');
        execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

        // 3. Pack Staff App dist
        console.log('📦 Packing Staff App (dist)...');
        const staffArchive = path.join(__dirname, 'staff_dist.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        // SFTP Uploads
        await new Promise((resolve, reject) => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);

                const putFile = (local, remote) => new Promise((res, rej) => {
                    console.log(`📤 Uploading ${path.basename(local)} -> ${remote}...`);
                    sftp.fastPut(local, remote, (e) => e ? rej(e) : res());
                });

                try {
                    await putFile(backendSrcArchive, '/tmp/backend_src.tar.gz');
                    await putFile(backendDistArchive, '/tmp/backend_dist.tar.gz');
                    await putFile(frontendArchive, '/tmp/frontend_dist.tar.gz');
                    await putFile(staffArchive, '/tmp/staff_dist.tar.gz');
                    await putFile(
                        path.join(__dirname, 'vamos-pos-backend', 'prisma', 'schema.prisma'),
                        '/tmp/schema.prisma'
                    );
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });

        // Remote extraction and service reload
        console.log('🔄 Executing remote updates, DB migration & PM2 restart...');
        const remoteCmd = `
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

            echo "=== 1. Updating Backend ==="
            cp /tmp/schema.prisma /var/www/vamos/vamos-pos-backend/prisma/schema.prisma
            mkdir -p /var/www/vamos/vamos-pos-backend/src
            tar -xzf /tmp/backend_src.tar.gz -C /var/www/vamos/vamos-pos-backend/src
            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist

            cd /var/www/vamos/vamos-pos-backend
            echo "--- DB Push schema ---"
            npx prisma db push --accept-data-loss || true

            echo "=== 2. Updating POS Frontend ==="
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            tar -xzf /tmp/frontend_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist

            echo "=== 3. Updating Staff App ==="
            mkdir -p /var/www/vamos/vamos-staff-app/dist
            tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-staff-app/dist
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            cp -r /var/www/vamos/vamos-staff-app/dist/* /var/www/vamos/vamos-pos-frontend/dist/staff/

            echo "=== 4. Cleaning /tmp archives ==="
            rm -f /tmp/backend_src.tar.gz /tmp/backend_dist.tar.gz /tmp/frontend_dist.tar.gz /tmp/staff_dist.tar.gz /tmp/schema.prisma

            echo "=== 5. Restarting PM2 & Nginx ==="
            pm2 restart all || pm2 restart vamos-backend
            systemctl restart nginx || true

            echo "🎉 ALL SERVICES SUCCESSFULLY UPDATED AND RESTARTED!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log(`\n✅ Remote deploy finished with exit code: ${code}`);
                // Cleanup local archives
                [backendSrcArchive, backendDistArchive, frontendArchive, staffArchive].forEach(f => {
                    if (fs.existsSync(f)) fs.unlinkSync(f);
                });
                conn.end();
            });
        });

    } catch (err) {
        console.error('❌ Deployment error:', err);
        conn.end();
    }
});

conn.connect(VPS_CONFIG);
