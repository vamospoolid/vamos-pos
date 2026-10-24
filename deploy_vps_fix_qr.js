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
console.log(`Connecting to VPS ${VPS_CONFIG.host}...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');
    try {
        // 1. Pack backend
        console.log('📦 Packing Backend...');
        const backendArchive = path.join(__dirname, 'backend_qr.tar.gz');
        execSync(`tar -czf "${backendArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(backendArchive, '/tmp/backend_qr.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 2. Pack frontend
        console.log('📦 Packing Frontend...');
        const frontendArchive = path.join(__dirname, 'frontend_qr.tar.gz');
        execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(frontendArchive, '/tmp/frontend_qr.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        const remoteCmd = `
            echo "--- Extracting Backend ---"
            tar -xzf /tmp/backend_qr.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_qr.tar.gz

            echo "--- Extracting Frontend ---"
            tar -xzf /tmp/frontend_qr.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/frontend_qr.tar.gz

            echo "--- Restarting PM2 Backend ---"
            pm2 restart vamos-backend || pm2 restart vamos-pos-backend

            echo "🎉 QR ORDER FIX DEPLOYED SUCCESSFULLY!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log('✅ All done!');
                conn.end();
            });
        });
    } catch (e) {
        console.error('Error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
