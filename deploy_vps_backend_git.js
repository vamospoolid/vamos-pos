const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

const REMOTE_DIR = '/var/www/vamos';
const PM2_APP_NAME = 'vamos-backend';

const conn = new Client();

console.log(`Connecting to VPS ${VPS_CONFIG.host} to deploy backend...`);

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('🔄 Pulling backend updates and rebuilding...\n');
    
    const deployCmd = `
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

        echo "=== 1. GIT PULL ==="
        cd ${REMOTE_DIR}
        git reset --hard HEAD
        git pull origin main || git pull origin master

        echo "\n=== 2. BUILD BACKEND ==="
        cd ${REMOTE_DIR}/vamos-pos-backend
        npm install --production=false
        npm run build

        echo "\n=== 3. RESTART PM2 ==="
        pm2 stop ${PM2_APP_NAME} 2>/dev/null || true
        pm2 start dist/server.js --name "${PM2_APP_NAME}"
        pm2 save

        echo "\n✅ Backend successfully deployed and restarted!"
    `;

    conn.exec(deployCmd, (err, stream) => {
        if (err) throw err;
        
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        
        stream.on('close', (code) => {
            console.log(`\n🔌 SSH Connection closed with code: ${code}`);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
