const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS 173.212.243.240!\n');

    async function deploy() {
        // 1. Pack website static out bundle
        console.log('📦 1. Packing & Deploying vamospool-website static build...');
        const localOut = path.join(__dirname, 'vamospool-website', 'out');
        const archive = path.join(__dirname, 'website_out.tar.gz');
        execSync(`tar -czf "${archive}" -C "${localOut}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(archive, '/tmp/website_out.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 2. Extract & Setup Nginx on VPS
        console.log('🔄 2. Extracting to /var/www/vamos/vamospool-website/out and updating Nginx...');
        const remoteCmd = `
            mkdir -p /var/www/vamos/vamospool-website/out
            tar -xzf /tmp/website_out.tar.gz -C /var/www/vamos/vamospool-website/out
            rm -f /tmp/website_out.tar.gz

            # Check if VamosPlayer.apk exists, copy to website out
            cp /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk /var/www/vamos/vamospool-website/out/VamosPlayer.apk 2>/dev/null || true

            # Create or update Nginx site config for vamospool.id
            cat << 'EOF' > /etc/nginx/sites-available/vamospool_landing
server {
    listen 80;
    server_name vamospool.id www.vamospool.id;

    root /var/www/vamos/vamospool-website/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    location ~* \.apk$ {
        root /var/www/vamos/vamospool-website/out;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment; filename=VamosPlayer.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Cache static assets
    location /_next/static/ {
        alias /var/www/vamos/vamospool-website/out/_next/static/;
        expires 365d;
        access_log off;
    }

    location /images/ {
        alias /var/www/vamos/vamospool-website/out/images/;
        expires 30d;
        access_log off;
    }
}
EOF

            ln -sf /etc/nginx/sites-available/vamospool_landing /etc/nginx/sites-enabled/
            nginx -t && systemctl reload nginx
            echo "SUCCESS_DEPLOY_WEBSITE"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                try { fs.unlinkSync(archive); } catch(e){}
                console.log('\n🎉 Selesai deploy website resmi vamospool.id ke VPS!');
                conn.end();
            });
        });
    }

    deploy().catch(err => {
        console.error('Deploy error:', err);
        conn.end();
    });
}).connect(config);
