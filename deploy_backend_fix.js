const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

const REMOTE_DIR = '/var/www/vamos/vamos-pos-backend';
const LOCAL_FILE_PATH = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'player', 'player.controller.ts');
const REMOTE_FILE_PATH = `${REMOTE_DIR}/src/modules/player/player.controller.ts`;

const conn = new Client();

console.log(`Connecting to VPS ${VPS_CONFIG.host} to deploy backend fix...`);

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('🔄 Uploading player.controller.ts...');

    conn.sftp((err, sftp) => {
        if (err) {
            console.error('❌ Failed to start SFTP session:', err);
            conn.end();
            return;
        }

        sftp.fastPut(LOCAL_FILE_PATH, REMOTE_FILE_PATH, (err) => {
            if (err) {
                console.error('❌ Failed to upload file:', err);
                conn.end();
                return;
            }

            console.log('✅ File uploaded successfully!');
            console.log('🔄 Rebuilding and restarting backend...');

            const deployCmd = `
                source ~/.bashrc 2>/dev/null || true
                source ~/.nvm/nvm.sh 2>/dev/null || true
                export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

                cd ${REMOTE_DIR}
                echo "Building backend..."
                npm run build
                
                echo "Restarting via PM2..."
                pm2 restart epic-pos-backend || pm2 restart all
                
                echo "✅ Backend successfully updated and restarted!"
            `;

            conn.exec(deployCmd, (err, stream) => {
                if (err) {
                    console.error('❌ Exec error:', err);
                    conn.end();
                    return;
                }
                
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                
                stream.on('close', (code) => {
                    console.log(`\n🔌 SSH Connection closed with code: ${code}`);
                    conn.end();
                });
            });
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
