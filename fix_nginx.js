const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected untuk Fix Nginx Proxy!');
    
    const fixCmd = `
        # Create a fresh configuration for all subdomains
        cat <<EOT > /etc/nginx/sites-available/vamos
# --- BACKEND API ---
server {
    listen 80;
    server_name api.vamospool.id;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}

# --- POS DASHBOARD (KASIR) ---
server {
    listen 80;
    server_name pos.vamospool.id;
    root /var/www/vamos-pos/vamos-pos-frontend/dist;
    index index.html;
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
}

# --- PLAYER APP ---
server {
    listen 80;
    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
}

# --- ADMIN APP ---
server {
    listen 80;
    server_name admin.vamospool.id;
    root /var/www/vamos-pos/vamos-admin-app/dist;
    index index.html;
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
}
EOT

        # 4. Test & Reload
        sudo nginx -t && sudo systemctl restart nginx
        
        # 5. SSL RE-ACTIVATION (Important)
        echo "Applying SSL via Certbot..."
        sudo certbot --nginx --non-interactive --agree-tos --email ahmad@vamospool.id -d api.vamospool.id -d pos.vamospool.id -d app.vamospool.id -d admin.vamospool.id
        
        sudo systemctl restart nginx
    `;

    conn.exec(fixCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log('\n🚀 Proses selesai dengan exit code: ' + code);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
