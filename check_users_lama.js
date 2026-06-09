const { Client } = require('ssh2');

const VPS_LAMA = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

const conn = new Client();
console.log('👥 Memeriksa data user di database LAMA...');

conn.on('ready', () => {
    // let's check all databases in postgres on old VPS
    const cmd = `
        echo "=== Daftar Database ==="
        PGPASSWORD=vamos_password123 psql -U vamos_user -h localhost -d vamos_db -c "\\\\l" 2>&1
        
        echo "\\n=== Daftar Tabel di vamos_db ==="
        PGPASSWORD=vamos_password123 psql -U vamos_user -h localhost -d vamos_db -c "\\\\dt" 2>&1

        echo "\\n=== Daftar User di vamos_db ==="
        PGPASSWORD=vamos_password123 psql -U vamos_user -h localhost -d vamos_db -c "SELECT id, email, name, role FROM \\"User\\";" 2>&1
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error:', err.message)).connect(VPS_LAMA);
