const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔧 Mengonfigurasi PostgreSQL VPS agar menerima koneksi eksternal...');

conn.on('ready', () => {
    const cmd = `
        # Cari file konfigurasi postgresql
        PG_CONF=$(find /etc/postgresql -name "postgresql.conf" | head -n 1)
        PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" | head -n 1)
        
        if [ -z "$PG_CONF" ] || [ -z "$PG_HBA" ]; then
            echo "❌ Konfigurasi PostgreSQL tidak ditemukan!"
            exit 1
        fi
        
        echo "Found postgresql.conf at: $PG_CONF"
        echo "Found pg_hba.conf at: $PG_HBA"
        
        # 1. Edit listen_addresses = '*' di postgresql.conf
        # Hapus baris listen_addresses lama jika ada atau langsung timpa/tambahkan di akhir
        sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
        sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
        
        # Pastikan listen_addresses = '*' ada di file
        if ! grep -q "listen_addresses = '*'" "$PG_CONF"; then
            echo "listen_addresses = '*'" >> "$PG_CONF"
        fi
        
        # 2. Tambahkan izin koneksi di pg_hba.conf
        # Tambahkan baris baru untuk mengizinkan semua host mengakses vamos_pos_db
        if ! grep -q "0.0.0.0/0" "$PG_HBA"; then
            echo "host    vamos_pos_db    all             0.0.0.0/0               scram-sha-256" >> "$PG_HBA"
            echo "host    vamos_pos_db    all             0.0.0.0/0               md5" >> "$PG_HBA"
            echo "host    vamos_pos_db    all             ::/0                    scram-sha-256" >> "$PG_HBA"
        fi
        
        # 3. Restart PostgreSQL service
        echo "🔄 Merestart PostgreSQL..."
        systemctl restart postgresql
        
        # 4. Verifikasi port 5432
        echo "\\n=== Verifikasi status listening port 5432 ==="
        ss -tuln | grep 5432
        
        echo "✅ Konfigurasi koneksi eksternal PostgreSQL selesai!"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);
