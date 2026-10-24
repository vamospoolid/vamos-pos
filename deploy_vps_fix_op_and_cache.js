const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000
};

const conn = new Client();
console.log('🚀 Connecting to VPS to deploy Op Filter & Nginx No-Cache update...');

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');
    try {
        // 1. Pack Backend Dist
        console.log('📦 Packing Backend dist...');
        const backendArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        // 2. Pack Staff App Dist
        console.log('📦 Packing Staff App dist...');
        const staffArchive = path.join(__dirname, 'staff_dist_rel.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        // Upload archives and backend staff source files
        console.log('📤 Uploading archives to VPS...');
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                sftp.fastPut(backendArchive, '/tmp/backend_dist.tar.gz', (err) => {
                    if (err) return reject(err);

                    sftp.fastPut(staffArchive, '/tmp/staff_dist_rel.tar.gz', (err) => {
                        if (err) return reject(err);

                        const localStaffService = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.service.ts');
                        const localStaffController = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.controller.ts');

                        sftp.fastPut(localStaffService, '/tmp/staff.service.ts', (err) => {
                            if (err) return reject(err);
                            sftp.fastPut(localStaffController, '/tmp/staff.controller.ts', (err) => {
                                if (err) return reject(err);
                                console.log('   All files uploaded.');
                                resolve();
                            });
                        });
                    });
                });
            });
        });

        // Remote Commands: extract, update nginx, reload PM2
        console.log('⚙️ Executing remote commands...');
        const remoteCmd = `
            # 1. Update Backend
            echo "--- 1. Updating Backend ---"
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz
            cp /tmp/staff.service.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.service.ts
            cp /tmp/staff.controller.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.controller.ts
            rm -f /tmp/staff.service.ts /tmp/staff.controller.ts

            # 2. Update Staff Portal
            echo "--- 2. Updating Staff Portal ---"
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -rf /var/www/vamos/vamos-pos-frontend/dist/staff/*
            tar -xzf /tmp/staff_dist_rel.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -f /tmp/staff_dist_rel.tar.gz

            # 3. Update Nginx Config with No-Cache for HTML
            echo "--- 3. Updating Nginx with No-Cache Headers for Staff ---"
            cat << 'NGINX_EOF' > /etc/nginx/sites-available/vamos
# 1. KASIR (POS)
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

    # Staff APK download
    location = /VamosStaff.apk {
        root /var/www/vamos/vamos-pos-frontend/dist;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment; filename=VamosStaff.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Player / generic APK download
    location ~* .apk$ {
        root /var/www/vamos/vamos-pos-frontend/dist;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment; filename=VamosPlayer.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Staff Portal
    location /staff/ {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /staff/index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # HTML files no-cache
    location ~* \.html$ {
        root /var/www/vamos/vamos-pos-frontend/dist;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
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

    location ~* .apk$ {
        root /var/www/vamos/vamos-player-app/dist;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment; filename=VamosPlayer.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

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
NGINX_EOF

            nginx -t && systemctl reload nginx
            echo "--- 4. Restarting Backend PM2 ---"
            pm2 restart vamos-backend
            echo "🎉 ALL DONE!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log(`\n✅ Remote deploy finished with code: ${code}`);
                conn.end();
            });
        });
    } catch (e) {
        console.error('Error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
