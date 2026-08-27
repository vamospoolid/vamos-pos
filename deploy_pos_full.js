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

console.log('Connecting to VPS for POS Backend & Frontend deploy...');

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');
    try {
        // 1. Deploy Backend
        console.log('📦 [1/2] Deploying POS Backend...');
        const backendLocal = path.join(__dirname, 'vamos-pos-backend', 'dist');
        const backendArchive = path.join(__dirname, 'pos_backend_dist.tar.gz');
        const backendRemote = '/tmp/pos_backend_dist.tar.gz';
        const backendDest = '/var/www/vamos/vamos-pos-backend/dist';

        execSync(`tar -czf "${backendArchive}" -C "${backendLocal}" .`);
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(backendArchive, backendRemote, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
        await new Promise((resolve, reject) => {
            const cmd = `mkdir -p ${backendDest} && tar -xzf ${backendRemote} -C ${backendDest} && rm -f ${backendRemote} && pm2 restart vamos-backend`;
            conn.exec(cmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('data', () => {});
                stream.stderr.on('data', () => {});
                stream.on('close', resolve);
            });
        });
        if (fs.existsSync(backendArchive)) fs.unlinkSync(backendArchive);
        console.log('✅ POS Backend deployed & PM2 restarted!');

        // 2. Deploy Frontend
        console.log('📦 [2/2] Deploying POS Frontend...');
        const frontendLocal = path.join(__dirname, 'vamos-pos-frontend', 'dist');
        const frontendArchive = path.join(__dirname, 'pos_frontend_dist.tar.gz');
        const frontendRemote = '/tmp/pos_frontend_dist.tar.gz';
        const frontendDest = '/var/www/vamos/vamos-pos-frontend/dist';

        execSync(`tar -czf "${frontendArchive}" -C "${frontendLocal}" .`);
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(frontendArchive, frontendRemote, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
        await new Promise((resolve, reject) => {
            const cmd = `mkdir -p ${frontendDest} && tar -xzf ${frontendRemote} -C ${frontendDest} && rm -f ${frontendRemote} && systemctl reload nginx`;
            conn.exec(cmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('data', () => {});
                stream.stderr.on('data', () => {});
                stream.on('close', resolve);
            });
        });
        if (fs.existsSync(frontendArchive)) fs.unlinkSync(frontendArchive);
        console.log('✅ POS Frontend deployed & Nginx reloaded!');

        conn.end();
    } catch (e) {
        console.error('Error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
