const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔧 Rebuild frontend dengan API URL yang benar...');

conn.on('ready', () => {
    const cmd = `
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

        echo "=== 1. Set .env POS Frontend ==="
        cat << 'EOF' > /var/www/vamos/vamos-pos-frontend/.env
VITE_API_URL=https://api.vamospool.id/api
EOF
        echo "✅ .env POS dibuat"

        echo "\\n=== 2. Set .env Player App ==="
        cat << 'EOF' > /var/www/vamos/vamos-player-app/.env
VITE_API_URL=https://api.vamospool.id/api
EOF
        echo "✅ .env Player dibuat"

        echo "\\n=== 3. Set .env Admin App ==="
        cat << 'EOF' > /var/www/vamos/vamos-admin-app/.env
VITE_API_URL=https://api.vamospool.id/api
EOF
        echo "✅ .env Admin dibuat"

        echo "\\n=== 4. Rebuild POS Frontend ==="
        cd /var/www/vamos/vamos-pos-frontend
        npm run build
        echo "✅ POS rebuild selesai"

        echo "\\n=== 5. Rebuild Player App ==="
        cd /var/www/vamos/vamos-player-app
        npm run build
        echo "✅ Player rebuild selesai"

        echo "\\n=== 6. Rebuild Admin App ==="
        cd /var/www/vamos/vamos-admin-app
        npm run build
        echo "✅ Admin rebuild selesai"

        echo "\\n🎉 SEMUA REBUILD SELESAI! Refresh browser sekarang."
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\n🔌 Exit code:', code);
            conn.end();
        });
    });
}).on('error', err => console.error('❌ Error:', err.message)).connect(VPS_BARU);
