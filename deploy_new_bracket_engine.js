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
        // Deploy Backend dist
        console.log('📦 1. Packing & Deploying POS Backend dist...');
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

        // Extract and restart on VPS
        console.log('🔄 2. Extracting and restarting backend on VPS...');
        const remoteCmd = `
            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz

            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            pm2 restart vamos-backend || pm2 restart all || true
            echo "SUCCESS_DEPLOY_BACKEND"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                try { fs.unlinkSync(backendArchive); } catch(e){}
                console.log('\n🎉 Selesai deploy Backend terbaru ke VPS!');
                conn.end();
            });
        });
    }

    deploy().catch(err => {
        console.error('Deploy error:', err);
        conn.end();
    });
}).connect(config);
