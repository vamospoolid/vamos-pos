const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "=== Struktur tabel License saat ini ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "\\\\d \\"License\\"" 2>&1
        
        echo "\\n=== Isi tabel License ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "SELECT * FROM \\"License\\" LIMIT 3;" 2>&1
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error(err.message)).connect(VPS_BARU);
