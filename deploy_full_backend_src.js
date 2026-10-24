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
console.log(`🚀 Connecting to VPS ${VPS_CONFIG.host} to upload full backend modules and staff routes...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');

    try {
        // Create archive of local backend src
        console.log('📦 Archiving backend src folder...');
        const srcArchive = path.join(__dirname, 'backend_src.tar.gz');
        execSync(`tar -czf "${srcArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'src')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                console.log('📤 Uploading backend_src.tar.gz to VPS /tmp...');
                sftp.fastPut(srcArchive, '/tmp/backend_src.tar.gz', (err) => {
                    if (err) return reject(err);
                    console.log('✅ backend_src.tar.gz uploaded!');
                    resolve();
                });
            });
        });

        const remoteCmd = `
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

            echo "📂 Extracting src files to /var/www/vamos/vamos-pos-backend/src..."
            tar -xzf /tmp/backend_src.tar.gz -C /var/www/vamos/vamos-pos-backend/src
            rm -f /tmp/backend_src.tar.gz

            cd /var/www/vamos/vamos-pos-backend
            echo "🔨 Rebuilding backend with staff routes..."
            npm run build

            echo "🔄 Restarting vamos-backend..."
            pm2 restart vamos-backend || pm2 restart all

            echo "🎉 BACKEND SYNC AND RESTART COMPLETE!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log(`\n✅ Finished with exit code: ${code}`);
                conn.end();
            });
        });

    } catch (e) {
        console.error('❌ Error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
