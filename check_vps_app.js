const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔍 Memeriksa file App.tsx di VPS...');

conn.on('ready', () => {
    const cmd = `
        echo "=== Cek kata SPLIT di App.tsx VPS ==="
        grep -n -C 5 -i "SPLIT" /var/www/vamos/vamos-pos-frontend/src/App.tsx 2>&1 | head -n 50
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error:', err.message)).connect(VPS_BARU);
