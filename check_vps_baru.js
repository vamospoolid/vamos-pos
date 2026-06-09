const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS 173.212.243.240!\n');
    
    conn.exec(`
        echo "=== SYSTEM INFO ==="
        uname -a
        echo ""
        echo "=== NODE & PM2 ==="
        node -v 2>/dev/null || echo "Node: tidak ada"
        pm2 list 2>/dev/null || echo "PM2: tidak ada"
        echo ""
        echo "=== FOLDER /var/www/ ==="
        ls -la /var/www/ 2>/dev/null || echo "/var/www tidak ada"
        echo ""
        echo "=== DATABASE POSTGRES ==="
        sudo -u postgres psql -c "\\l" 2>/dev/null || echo "PostgreSQL tidak bisa diakses"
        echo ""
        echo "=== NGINX STATUS ==="
        systemctl is-active nginx 2>/dev/null
        echo ""
        echo "=== NGINX SITES ==="
        ls /etc/nginx/sites-enabled/ 2>/dev/null || echo "Tidak ada nginx sites"
        echo ""
        echo "=== PORT AKTIF ==="
        ss -tlnp 2>/dev/null | grep -E '(3000|3001|3002|4000|80|443|5432)'
        echo ""
        echo "=== DISK USAGE ==="
        df -h /
    `, (err, stream) => {
        if (err) { console.error('❌ Error:', err.message); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\n✅ Cek selesai!'); conn.end(); });
    });
}).on('error', (err) => {
    console.error('❌ GAGAL CONNECT:', err.message);
    console.log('Kemungkinan: password salah, port berbeda, atau firewall');
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000
});
