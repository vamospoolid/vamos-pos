const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔍 Memeriksa daftar database di VPS...');

conn.on('ready', () => {
    const cmd = `PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c "\\l"`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);
