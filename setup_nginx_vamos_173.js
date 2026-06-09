const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

const conn = new Client();

console.log('Menghubungkan ke VPS 173.212.243.240 untuk setup Nginx...');

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('🔄 Memulai konfigurasi Nginx dan Environment Variables...');
    
    const setupCmd = `
        echo "=== 1. SETUP ENV BACKEND (Port 4005) ==="
        cat << 'EOF' > /var/www/vamos/vamos-pos-backend/.env
PORT=4005
NODE_ENV=production
# Tambahkan variabel database/lainnya di bawah ini nanti:
# DATABASE_URL=postgresql://user:password@localhost:5432/vamos_db?schema=public
EOF
        
        echo "-> Me-restart backend agar menggunakan Port 4005..."
        cd /var/www/vamos/vamos-pos-backend
        pm2 restart vamos-backend || true
        pm2 save

        echo "\\n=== 2. MEMBUAT KONFIGURASI NGINX VAMOS ==="
        cat << 'EOF' > /etc/nginx/sites-available/vamos
# 1. KASIR (POS)
server {
    listen 80;
    server_name pos.vamospool.id;
    location / {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 2. PLAYER APP (APK WEB)
server {
    listen 80;
    server_name app.vamospool.id;
    location / {
        root /var/www/vamos/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 3. SUPER ADMIN
server {
    listen 80;
    server_name admin.vamospool.id;
    location / {
        root /var/www/vamos/vamos-admin-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 4. BACKEND API & SOCKETS
server {
    listen 80;
    server_name api.vamospool.id;
    location / {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

        echo "\\n=== 3. MENGAKTIFKAN NGINX & RESTART ==="
        ln -sf /etc/nginx/sites-available/vamos /etc/nginx/sites-enabled/vamos
        
        # Test konfigurasi Nginx untuk memastikan tidak ada error syntax
        nginx -t
        
        if [ $? -eq 0 ]; then
            echo "-> Restarting Nginx..."
            systemctl restart nginx
            echo "✅ SETUP SELESAI!"
            echo "Semua domain (pos, app, admin, api) sudah diarahkan ke Vamos dengan Port 4005."
        else
            echo "❌ Terjadi error pada konfigurasi Nginx. Nginx tidak direstart."
        fi
    `;

    conn.exec(setupCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\\n🔌 Koneksi SSH ditutup dengan kode:', code);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
