const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('👥 Memeriksa data user dan lisensi di database baru setelah restore...');

conn.on('ready', () => {
    const cmd = `
        echo "=== Daftar User ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "SELECT id, email, name, role FROM \\"User\\";" 2>&1
        
        echo "\\n=== Daftar License ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "SELECT * FROM \\"License\\";" 2>&1
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error:', err.message)).connect(VPS_BARU);
