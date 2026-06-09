const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Connected! Cek READ-ONLY - tidak ganggu bengkel & optik\n');
    
    conn.exec(`
        echo "=== CEK DATABASE_URL DARI PM2 PROCESS vamos-backend ==="
        cat /proc/$(pm2 pid vamos-backend 2>/dev/null)/environ 2>/dev/null | tr '\\0' '\\n' | grep -E '(DATABASE_URL|DB_|PORT)' || echo "Tidak bisa baca via /proc"
        echo ""

        echo "=== ALTERNATIF: CEK ecosystem / pm2 config ==="
        cat /var/www/vamos/ecosystem.config.js 2>/dev/null || echo "ecosystem.config.js tidak ada"
        cat /var/www/vamos/vamos-pos-backend/ecosystem.config.js 2>/dev/null || echo "tidak ada di subfolder"
        echo ""

        echo "=== DATA TRANSAKSI: vamos_pos ==="
        sudo -u postgres psql -d vamos_pos -c "
            SELECT 
                (SELECT COUNT(*) FROM \\\"Session\\\") as total_sessions,
                (SELECT COUNT(*) FROM \\\"Payment\\\") as total_payments,
                (SELECT COUNT(*) FROM \\\"Member\\\") as total_members,
                (SELECT MAX(\\\"createdAt\\\") FROM \\\"Session\\\") as sesi_terakhir;
        " 2>/dev/null || echo "Gagal query vamos_pos"
        echo ""

        echo "=== DATA TRANSAKSI: vamos_pos_db ==="
        sudo -u postgres psql -d vamos_pos_db -c "
            SELECT 
                (SELECT COUNT(*) FROM \\\"Session\\\") as total_sessions,
                (SELECT COUNT(*) FROM \\\"Payment\\\") as total_payments,
                (SELECT COUNT(*) FROM \\\"Member\\\") as total_members,
                (SELECT MAX(\\\"createdAt\\\") FROM \\\"Session\\\") as sesi_terakhir;
        " 2>/dev/null || echo "Gagal query vamos_pos_db"
        echo ""

        echo "=== SYNC WORKER URL (di source code) ==="
        grep -r 'VPS_URL\\|SYNC_URL\\|pos.vamospool\\|sync/receive' /var/www/vamos/vamos-pos-backend/dist/ 2>/dev/null | head -5 || \
        grep -r 'VPS_URL\\|SYNC_URL\\|pos.vamospool' /var/www/vamos/vamos-pos-backend/src/ 2>/dev/null | head -5 || \
        echo "Tidak ditemukan di source"
        echo ""

        echo "=== SELESAI - tidak ada yang diubah ==="
    `, (err, stream) => {
        if (err) { console.error('❌ Error:', err.message); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { 
            console.log('\n✅ Cek selesai! Bengkel & optik tidak terganggu.');
            conn.end(); 
        });
    });
}).on('error', err => {
    console.error('❌ GAGAL:', err.message);
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000
});
