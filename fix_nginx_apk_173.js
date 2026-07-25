const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    const cmd = `
        echo "=== 1. COPY APK TO ALL DESTINATIONS ==="
        # Pastikan folder target ada
        mkdir -p /var/www/vamos/vamos-pos-frontend/dist
        mkdir -p /var/www/vamos/vamos-pos-backend/public
        
        # Salin file APK ke semua target agar bisa di-download lewat domain manapun
        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk 2>/dev/null && echo "OK: Copied to pos-frontend/dist" || echo "SKIP: pos-frontend/dist"
        cp /var/www/vamos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos/vamos-pos-backend/public/VamosPlayer.apk 2>/dev/null && echo "OK: Copied to pos-backend/public" || echo "SKIP: pos-backend/public"
        
        echo "\\n=== 2. UPDATE NGINX CONFIGURATION ==="
        # Jalankan python script di server untuk melakukan rewrite file config Nginx dengan aman
        python3 << 'PYEOF'
import re

config_path = '/etc/nginx/sites-available/vamos'
with open(config_path, 'r') as f:
    content = f.read()

# 1. Update server block app.vamospool.id
old_app_block = """server {
    server_name app.vamospool.id;
    location / {
        root /var/www/vamos/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }"""

new_app_block = """server {
    server_name app.vamospool.id;

    location ~* \\.apk$ {
        root /var/www/vamos/vamos-player-app/dist;
        add_header Content-Type "application/vnd.android.package-archive";
        add_header Content-Disposition "attachment; filename=VamosPlayer.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    location / {
        root /var/www/vamos/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }"""

# 2. Update server block pos.vamospool.id
old_pos_block = """    # Frontend static files
    location / {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }"""

new_pos_block = """    # APK download location
    location ~* \\.apk$ {
        root /var/www/vamos/vamos-pos-frontend/dist;
        add_header Content-Type "application/vnd.android.package-archive";
        add_header Content-Disposition "attachment; filename=VamosPlayer.apk";
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Frontend static files
    location / {
        root /var/www/vamos/vamos-pos-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }"""

updated = False

if old_app_block in content:
    content = content.replace(old_app_block, new_app_block)
    updated = True
    print("✅ app.vamospool.id block updated!")
else:
    print("⚠️ app.vamospool.id block pattern not found or already updated!")

if old_pos_block in content:
    content = content.replace(old_pos_block, new_pos_block)
    updated = True
    print("✅ pos.vamospool.id block updated!")
else:
    print("⚠️ pos.vamospool.id block pattern not found or already updated!")

if updated:
    with open(config_path, 'w') as f:
        f.write(content)
    print("🎉 Successfully updated Nginx configuration file!")
else:
    print("⚠️ No changes made to Nginx configuration.")
PYEOF

        echo "\\n=== 3. VERIFY NGINX CONFIG & RESTART ==="
        nginx -t
        if [ $? -eq 0 ]; then
            echo "-> Restarting Nginx..."
            systemctl restart nginx && echo "✅ Nginx restarted successfully!"
        else
            echo "❌ Nginx configuration test failed! Keeping old configuration active."
        fi

        echo "\\n=== 4. TEST HTTP HEADER OF APK ==="
        curl -s -I https://app.vamospool.id/VamosPlayer.apk
        echo ""
        curl -s -I https://pos.vamospool.id/VamosPlayer.apk
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n🔌 Done!');
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
