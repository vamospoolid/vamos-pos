const { Client } = require('ssh2');
const conn = new Client();

// ============================================================
// SCRIPT AMAN - READ/ADD ONLY
// ✅ Hanya: tambah nginx config, SSL, folder baru, DB baru
// ❌ TIDAK: ubah .env, DATABASE_URL, restart vamos-backend
// ❌ TIDAK: sentuh vamos_pos, bengkel, optik
// ============================================================

const NGINX_BILLIARD = `# billiard.codenusa.id — Vamos POS
server {
    listen 80;
    server_name billiard.codenusa.id;
    location /api/ {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }
    location /socket.io/ {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location / {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}`;

const NGINX_PLAYER = `# player.codenusa.id — Vamos Player App
server {
    listen 80;
    server_name player.codenusa.id;
    location / {
        root /var/www/vamos/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}`;

const NGINX_ADMIN = `# admin.codenusa.id — Super Admin Dashboard
server {
    listen 80;
    server_name admin.codenusa.id;
    location / {
        root /var/www/vamos-admin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}`;

conn.on('ready', () => {
    console.log('✅ SSH Connected!\n');
    console.log('🔧 Memulai setup AMAN (tidak ada perubahan database/backend)...\n');

    const cmd = `
        echo "================================================"
        echo "STEP 1: Buat folder admin placeholder"
        echo "================================================"
        mkdir -p /var/www/vamos-admin/dist
        cat > /var/www/vamos-admin/dist/index.html << 'EOF'
<!DOCTYPE html>
<html><head><title>Vamos Admin</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px">
<h1>🚀 Vamos Admin Dashboard</h1>
<p>Coming Soon — admin.codenusa.id</p>
</body></html>
EOF
        echo "✅ Folder vamos-admin dibuat"
        echo ""

        echo "================================================"
        echo "STEP 2: Tulis nginx config (TIDAK reload dulu)"
        echo "================================================"
        cat > /etc/nginx/sites-available/billiard-codenusa << 'NGINXEOF'
${NGINX_BILLIARD}
NGINXEOF

        cat > /etc/nginx/sites-available/player-codenusa << 'NGINXEOF'
${NGINX_PLAYER}
NGINXEOF

        cat > /etc/nginx/sites-available/admin-codenusa << 'NGINXEOF'
${NGINX_ADMIN}
NGINXEOF
        echo "✅ Config ditulis"
        echo ""

        echo "================================================"
        echo "STEP 3: Aktifkan nginx sites baru"
        echo "================================================"
        ln -sf /etc/nginx/sites-available/billiard-codenusa /etc/nginx/sites-enabled/
        ln -sf /etc/nginx/sites-available/player-codenusa /etc/nginx/sites-enabled/
        ln -sf /etc/nginx/sites-available/admin-codenusa /etc/nginx/sites-enabled/
        echo "✅ Sites diaktifkan"
        echo ""

        echo "================================================"
        echo "STEP 4: Test nginx config (validasi)"
        echo "================================================"
        nginx -t
        echo ""

        echo "================================================"
        echo "STEP 5: Reload nginx (zero-downtime)"
        echo "================================================"
        nginx -s reload
        echo "✅ Nginx di-reload (bengkel & optik tetap jalan)"
        echo ""

        echo "================================================"
        echo "STEP 6: SSL billiard.codenusa.id"
        echo "================================================"
        certbot --nginx -d billiard.codenusa.id --non-interactive --agree-tos --email ahmadasto@gmail.com --redirect
        echo ""

        echo "================================================"
        echo "STEP 7: SSL admin.codenusa.id"
        echo "================================================"
        certbot --nginx -d admin.codenusa.id --non-interactive --agree-tos --email ahmadasto@gmail.com --redirect
        echo ""

        echo "================================================"
        echo "STEP 8: Buat database BARU vamos_demo (kosong)"
        echo "(Tidak menyentuh vamos_pos sama sekali)"
        echo "================================================"
        sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='vamos_demo';" | grep -q 1 && \
            echo "⚠️  vamos_demo sudah ada, skip" || \
            sudo -u postgres psql -c "CREATE DATABASE vamos_demo;" && echo "✅ vamos_demo dibuat"
        echo ""

        echo "================================================"
        echo "✅ SEMUA SELESAI!"
        echo ""
        echo "🌐 billiard.codenusa.id  → Vamos POS (existing)"
        echo "🎮 player.codenusa.id   → Vamos Player App"
        echo "🎛️  admin.codenusa.id    → Admin Dashboard (placeholder)"
        echo ""
        echo "📦 vamos_pos     → TIDAK DIUBAH ✅"
        echo "📦 vamos_demo    → Database baru kosong ✅"
        echo "🔧 vamos-backend → TIDAK DIRESTART ✅"
        echo "🏢 bengkel/optik → TIDAK TERGANGGU ✅"
        echo "================================================"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('❌ Error:', err.message); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log(`\n🎉 Script selesai (exit code: ${code})`);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ GAGAL CONNECT:', err.message);
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000
});
