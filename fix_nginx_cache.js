const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

// Updated Nginx config with proper cache-control headers
const nginxConfig = `
# Backend API
server {
    server_name api.vamospool.id;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# POS Frontend
server {
    server_name pos.vamospool.id;
    root /var/www/vamos-pos/vamos-pos-frontend/dist;
    index index.html;
    
    # index.html: NEVER cache - always fresh
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri =404;
    }
    
    # Static assets (JS/CSS with hash): cache aggressively
    location ~* \\.(js|css|woff2|woff|ttf|svg|png|jpg|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Player App
server {
    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
    
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri =404;
    }
    
    location ~* \\.(js|css|woff2|woff|ttf|svg|png|jpg|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Admin App
server {
    server_name admin.vamospool.id;
    root /var/www/vamos-pos/vamos-admin-app/dist;
    index index.html;
    
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri =404;
    }
    
    location ~* \\.(js|css|woff2|woff|ttf|svg|png|jpg|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.vamospool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vamospool.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.vamospool.id pos.vamospool.id app.vamospool.id admin.vamospool.id;
    return 301 https://$host$request_uri;
}
`;

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    // Write new nginx config and reload
    const escaped = nginxConfig.replace(/'/g, "'\\''");
    const cmd = `cat > /etc/nginx/sites-enabled/vamos << 'NGINX_EOF'
${nginxConfig}
NGINX_EOF
nginx -t && systemctl reload nginx && echo "✅ Nginx updated & reloaded!" || echo "❌ Nginx config error!"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
