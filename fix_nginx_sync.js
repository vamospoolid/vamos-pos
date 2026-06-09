const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('🔧 Memperbaiki Nginx config - menambahkan proxy /api ke backend...');
    
    const newConfig = `# 1. KASIR (POS)
server {
    server_name pos.vamospool.id;

    # API & WebSocket: proxy ke backend port 4005
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
        proxy_connect_timeout 75s;
        client_max_body_size 10M;
    }

    # Socket.io: proxy ke backend
    location /socket.io/ {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend static files
    location / {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/pos.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# 2. PLAYER APP (APK WEB)
server {
    server_name app.vamospool.id;
    location / {
        root /var/www/vamos/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/pos.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# 3. SUPER ADMIN
server {
    server_name admin.vamospool.id;
    location / {
        root /var/www/vamos/vamos-admin-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/pos.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# 4. BACKEND API & SOCKETS (api.vamospool.id)
server {
    server_name api.vamospool.id;
    location / {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/pos.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = pos.vamospool.id) { return 301 https://$host$request_uri; }
    listen 80;
    server_name pos.vamospool.id;
    return 404;
}
server {
    if ($host = app.vamospool.id) { return 301 https://$host$request_uri; }
    listen 80;
    server_name app.vamospool.id;
    return 404;
}
server {
    if ($host = admin.vamospool.id) { return 301 https://$host$request_uri; }
    listen 80;
    server_name admin.vamospool.id;
    return 404;
}
server {
    if ($host = api.vamospool.id) { return 301 https://$host$request_uri; }
    listen 80;
    server_name api.vamospool.id;
    return 404;
}
`;

    // Write new config via heredoc
    const cmd = `cat > /etc/nginx/sites-available/vamos << 'NGINX_EOF'
${newConfig}
NGINX_EOF

echo "=== Testing Nginx config ==="
nginx -t

echo ""
echo "=== Reloading Nginx ==="
systemctl reload nginx

echo ""
echo "=== Test sync endpoint setelah fix ==="
sleep 2
curl -s -o /dev/null -w "HTTP Status: %{http_code}" -X POST https://pos.vamospool.id/api/system/sync/receive -H "Content-Type: application/json" -H "x-sync-secret: sync_secret_key" -d '{"users":[],"venues":[],"sessions":[]}'

echo ""
echo "✅ Nginx fix selesai!"
`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌', err.message)).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
