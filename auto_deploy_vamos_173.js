const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07', // Password VPS yang Anda berikan
    readyTimeout: 20000,
};

const REMOTE_DIR = '/var/www/vamos';
const GITHUB_REPO = 'https://github.com/vamospoolid/vamos-pos.git';
const PM2_APP_NAME = 'vamos-backend';

const conn = new Client();

console.log(`Menghubungkan ke VPS ${VPS_CONFIG.host}...`);

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS 173.212.243.240!');
    console.log('🔄 Memulai proses auto-deploy dari GitHub...\n');
    
    const deployCmd = `
        # Set Node environment paths jika diperlukan
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

        echo "=== 1. SETUP DIREKTORI & GITHUB PULL ==="
        mkdir -p ${REMOTE_DIR}
        cd ${REMOTE_DIR}
        
        # Mengecek apakah folder sudah berupa repository git
        if [ ! -d ".git" ]; then
            echo "-> Repository belum ada. Melakukan git clone..."
            # Clone isi repo langsung ke dalam folder /var/www/vamos
            git clone ${GITHUB_REPO} .
        else
            echo "-> Repository ditemukan. Melakukan git pull terbaru..."
            git reset --hard HEAD
            git pull origin main || git pull origin master
        fi

        echo "\\n=== 2. DEPLOY BACKEND (Node.js) ==="
        if [ -d "vamos-pos-backend" ]; then
            cd ${REMOTE_DIR}/vamos-pos-backend
            echo "-> Menginstall dependensi backend..."
            npm install
            
            echo "-> Membangun (Build) backend..."
            npm run build
            
            echo "-> Me-restart server backend dengan nama '${PM2_APP_NAME}'..."
            pm2 stop ${PM2_APP_NAME} 2>/dev/null || true
            pm2 start dist/server.js --name "${PM2_APP_NAME}"
            pm2 save
            echo "✅ Backend selesai dideploy."
        else
            echo "⚠️ Folder vamos-pos-backend tidak ditemukan!"
        fi

        echo "\\n=== 3. DEPLOY FRONTEND KASIR (React/Vite) ==="
        if [ -d "${REMOTE_DIR}/vamos-pos-frontend" ]; then
            cd ${REMOTE_DIR}/vamos-pos-frontend
            echo "-> Menginstall dependensi frontend..."
            npm install
            
            echo "-> Membangun (Build) frontend POS..."
            npm run build
            echo "✅ Frontend POS selesai dideploy ke folder dist/."
        else
            echo "⚠️ Folder vamos-pos-frontend tidak ditemukan!"
        fi

        echo "\\n=== 4. DEPLOY FRONTEND PLAYER (React/Vite) ==="
        if [ -d "${REMOTE_DIR}/vamos-player-app" ]; then
            cd ${REMOTE_DIR}/vamos-player-app
            echo "-> Menginstall dependensi Player..."
            npm install
            
            echo "-> Membangun (Build) frontend Player..."
            npm run build
            echo "✅ Frontend Player selesai dideploy ke folder dist/."
        else
            echo "⚠️ Folder vamos-player-app tidak ditemukan!"
        fi

        echo "\\n=== 5. DEPLOY FRONTEND ADMIN (React/Vite) ==="
        if [ -d "${REMOTE_DIR}/vamos-admin-app" ]; then
            cd ${REMOTE_DIR}/vamos-admin-app
            echo "-> Menginstall dependensi Admin..."
            npm install
            
            echo "-> Membangun (Build) frontend Admin..."
            npm run build
            echo "✅ Frontend Admin selesai dideploy ke folder dist/."
        else
            echo "⚠️ Folder vamos-admin-app tidak ditemukan!"
        fi

        echo "\\n🎉 === AUTO DEPLOYMENT SELESAI === 🎉"
        echo "Pastikan konfigurasi Nginx Anda untuk frontend mengarah ke:"
        echo "- POS: ${REMOTE_DIR}/vamos-pos-frontend/dist"
        echo "- APP: ${REMOTE_DIR}/vamos-player-app/dist"
        echo "- ADMIN: ${REMOTE_DIR}/vamos-admin-app/dist"
        echo "Pastikan .env backend menggunakan port unik (misal 4005) agar tidak mengganggu bengkel/optik."
    `;

    conn.exec(deployCmd, (err, stream) => {
        if (err) throw err;
        
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        
        stream.on('close', (code) => {
            console.log(`\\n🔌 Koneksi SSH ditutup dengan kode: ${code}`);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
    if (err.message.includes('authentication')) {
        console.error('⚠️ Pastikan password "Ahmad_dcc07" sudah benar.');
    }
}).connect(VPS_CONFIG);
