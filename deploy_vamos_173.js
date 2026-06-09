const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Ganti password ini dengan password VPS 173.212.243.240 Anda
const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'YOUR_PASSWORD_HERE' // <--- ISI PASSWORD VPS DI SINI
};

const REMOTE_DIR = '/var/www/vamos';
const PM2_APP_NAME = 'vamos-backend';

const conn = new Client();

console.log('Menghubungkan ke VPS ' + VPS_CONFIG.host + '...');

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS!');
    
    // Command untuk setup direktori, build frontend, build backend, dan PM2
    const deployCmd = `
        echo "=== 1. Setup Direktori Vamos ==="
        mkdir -p ${REMOTE_DIR}
        
        echo "=== 2. PERHATIAN UNTUK PORT ==="
        echo "Pastikan port backend di ${REMOTE_DIR}/vamos-pos-backend/.env menggunakan port yang belum dipakai (misal 4005)."
        echo "Jangan gunakan port yang sama dengan bengkel (misal 4002) atau optik (misal 4001)."
        
        echo "=== 3. Build & Restart PM2 Khusus Vamos ==="
        # Asumsikan source code sudah di-upload/di-clone ke /var/www/vamos
        if [ -d "${REMOTE_DIR}/vamos-pos-backend" ]; then
            cd ${REMOTE_DIR}/vamos-pos-backend
            
            echo "-> Install dependencies & build backend..."
            npm install
            npm run build
            
            echo "-> Restarting PM2 app: ${PM2_APP_NAME}"
            # Kita gunakan nama PM2 spesifik agar tidak me-restart bengkel/optik
            pm2 stop ${PM2_APP_NAME} 2>/dev/null || true
            pm2 start dist/server.js --name "${PM2_APP_NAME}"
            pm2 save
            
            echo "✅ Backend Vamos berhasil dijalankan!"
        else
            echo "⚠️  Folder backend belum ada di ${REMOTE_DIR}/vamos-pos-backend. Silakan upload source code Anda terlebih dahulu."
        fi
        
        echo "=== SELESAI ==="
    `;

    conn.exec(deployCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\\nExit code:', code);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
