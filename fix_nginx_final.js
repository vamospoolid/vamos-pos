const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

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

# Player App
server {
    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
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
    console.log('✅ SSH Connected untuk Fix Nginx Final!');
    
    conn.exec(`echo '${nginxConfig.replace(/'/g, "'\\''")}' | sudo tee /etc/nginx/sites-enabled/vamos > /dev/null && sudo systemctl restart nginx`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            if (code === 0) {
                console.log('🚀 Nginx Config updated & restarted!');
            } else {
                console.error('❌ Failed to update Nginx config.');
            }
            conn.end();
        });
        stream.resume();
    });
}).connect(config);
