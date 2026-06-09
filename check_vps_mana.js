const { Client } = require('ssh2');

const VPS_LAMA = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };
const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmaddcc07' };

function cekVPS(config, label) {
    const conn = new Client();
    conn.on('ready', () => {
        console.log(`\n✅ [${label}] SSH Terhubung!`);
        conn.exec(`
            echo "=== NODE & PM2 ===" 
            node -v 2>/dev/null || echo "Node: tidak ada"
            pm2 list 2>/dev/null || echo "PM2: tidak ada"
            echo ""
            echo "=== FOLDER PROJECT ==="
            ls /var/www/ 2>/dev/null || echo "Folder /var/www tidak ada"
            echo ""
            echo "=== DATABASE POSTGRES ==="
            sudo -u postgres psql -c "\\l" 2>/dev/null || echo "PostgreSQL: tidak ada / tidak bisa akses"
            echo ""
            echo "=== NGINX STATUS ==="
            systemctl status nginx --no-pager 2>/dev/null | head -5 || echo "Nginx: tidak ada"
            echo ""
            echo "=== PORT YANG AKTIF ==="
            ss -tlnp | grep -E '(3000|3001|4000|80|443)' 2>/dev/null || echo "Tidak ada port aktif"
        `, (err, stream) => {
            if (err) { console.error(`❌ [${label}] Error:`, err.message); conn.end(); return; }
            stream.on('data', d => process.stdout.write(`[${label}] ${d}`));
            stream.stderr.on('data', d => process.stderr.write(`[${label}] STDERR: ${d}`));
            stream.on('close', () => { console.log(`\n--- [${label}] Selesai ---`); conn.end(); });
        });
    }).on('error', (err) => {
        console.error(`\n❌ [${label}] GAGAL CONNECT: ${err.message}`);
        console.log(`   → IP ${config.host} mungkin sudah mati atau tidak bisa diakses`);
    }).connect(config);
}

console.log('🔍 Mengecek kedua VPS...\n');
console.log('=' .repeat(50));

// Cek VPS Lama dulu
cekVPS(VPS_LAMA, 'VPS LAMA 144.91.73.36');

// Cek VPS Baru setelah 3 detik
setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    cekVPS(VPS_BARU, 'VPS BARU 173.212.243.240');
}, 3000);
