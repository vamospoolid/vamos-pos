const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "=== Cari config Nginx untuk vamos ==="
        ls /etc/nginx/sites-available/
        echo ""
        echo "=== Isi config aktif ==="
        cat /etc/nginx/sites-available/vamos-pos 2>/dev/null || cat /etc/nginx/sites-available/default | grep -A 50 "vamos\\|pos.vamospool"
        echo ""
        echo "=== Test apakah endpoint sync bisa diakses ==="
        curl -s -o /dev/null -w "%{http_code}" -X POST https://pos.vamospool.id/api/system/sync/receive -H "Content-Type: application/json" -H "x-sync-secret: sync_secret_key" -d '{}'
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
