const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔍 Memeriksa konfigurasi koneksi luar PostgreSQL (Port 5432) di VPS Baru...');

conn.on('ready', () => {
    const cmd = `
        echo "=== 1. Cek listen_addresses di postgresql.conf ==="
        grep -i "listen_addresses" /etc/postgresql/*/main/postgresql.conf || echo "postgresql.conf tidak ditemukan di path standar."
        
        echo "\\n=== 2. Cek izin koneksi luar di pg_hba.conf ==="
        grep -v '^#' /etc/postgresql/*/main/pg_hba.conf | grep -E "host.*all.*all" || echo "Tidak ada konfigurasi host all all terbuka."
        
        echo "\\n=== 3. Cek Status UFW (Firewall) ==="
        ufw status verbose || echo "UFW tidak terinstall."
        
        echo "\\n=== 4. Cek port 5432 listening status ==="
        ss -tuln | grep 5432 || netstat -tuln | grep 5432
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);
