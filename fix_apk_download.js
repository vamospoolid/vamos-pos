const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "=== Step 1: Copy APK ke frontend dist ==="
        cp /var/www/vamos-pos/vamos-pos-backend/public/VamosPlayer.apk \
           /var/www/vamos-pos/vamos-pos-frontend/dist/VamosPlayer.apk
        ls -lh /var/www/vamos-pos/vamos-pos-frontend/dist/VamosPlayer.apk

        echo "=== Step 2: Update Nginx config - tambah location APK ==="
        NGINX_CONF="/etc/nginx/sites-enabled/vamos"
        
        # Tambahkan location block untuk APK SEBELUM location / di server pos.vamospool.id
        # Gunakan sed untuk insert sebelum "location / {"
        sed -i 's|location / {|location ~* \\.apk$ {\n        root /var/www/vamos-pos/vamos-pos-frontend/dist;\n        add_header Content-Disposition "attachment";\n        add_header Content-Type "application/vnd.android.package-archive";\n    }\n\n    location / {|' "$NGINX_CONF"
        
        echo "=== Step 3: Verifikasi config Nginx ==="
        nginx -t && echo "Nginx config OK!" || echo "ERROR! Config salah!"
        
        echo "=== Step 4: Reload Nginx ==="
        nginx -s reload && echo "Nginx reloaded OK!"
        
        echo "=== Step 5: Cek APK file ada ==="
        ls -lh /var/www/vamos-pos/vamos-pos-frontend/dist/VamosPlayer.apk
        
        echo "=== SELESAI ==="
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\nDone!'); conn.end(); });
    });
}).connect({ host: '5.189.165.222', port: 22, username: 'root', password: 'Ahmaddcc07' });
