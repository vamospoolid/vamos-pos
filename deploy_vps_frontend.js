const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

const REMOTE_DIR = '/var/www/vamos';

const conn = new Client();

console.log(`Connecting to VPS ${VPS_CONFIG.host} to deploy frontend...`);

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('🔄 Pulling frontend updates and rebuilding...\n');
    
    const deployCmd = `
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

        echo "=== 1. GIT PULL ==="
        cd ${REMOTE_DIR}
        git reset --hard HEAD
        git pull origin main || git pull origin master

        echo "\n=== 2. BUILD FRONTEND ==="
        cd ${REMOTE_DIR}/vamos-pos-frontend
        npm install --production=false
        npm run build
        
        echo "\n✅ Frontend successfully deployed!"
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
