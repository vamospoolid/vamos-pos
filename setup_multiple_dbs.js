const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🔄 Membuat dan menyinkronkan database vamos_pos dan vamos_db untuk kecocokan kasir...');

conn.on('ready', () => {
    const cmd = `
        # Dump data dari vamos_pos_db yang sudah lengkap
        echo "=== 1. Membuat Backup dari database yang sudah lengkap ==="
        PGPASSWORD=postgres pg_dump -U postgres -h 127.0.0.1 -d vamos_pos_db -F c -b -v -f /tmp/vamos_temp.backup
        
        echo "\\n=== 2. Membuat database vamos_pos dan vamos_db ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE vamos_pos;" 2>/dev/null || echo "Database vamos_pos sudah ada."
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE vamos_db;" 2>/dev/null || echo "Database vamos_db sudah ada."
        
        echo "\\n=== 3. Restore data ke vamos_pos ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        PGPASSWORD=postgres pg_restore -U postgres -h 127.0.0.1 -d vamos_pos -v /tmp/vamos_temp.backup 2>/dev/null || true
        
        echo "\\n=== 4. Restore data ke vamos_db ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        PGPASSWORD=postgres pg_restore -U postgres -h 127.0.0.1 -d vamos_db -v /tmp/vamos_temp.backup 2>/dev/null || true
        
        # Bersihkan file backup temp
        rm -f /tmp/vamos_temp.backup
        
        echo "\\n=== 5. Menyamakan Lisensi di semua DB ==="
        for db in vamos_pos_db vamos_pos vamos_db; do
            echo "Mengaktifkan lisensi di database $db..."
            PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d $db -c "
                INSERT INTO \\"License\\" (id, \\"licenseKey\\", \\"hardwareId\\", \\"isActivated\\", \\"isActive\\", \\"createdAt\\", \\"updatedAt\\")
                VALUES ('vamos-cloud-license-001', 'VAMOS-VPS-UNLIMITED-2026', 'LINUX-X64-NODE-MACHINE', true, true, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET \\"isActivated\\" = true, \\"isActive\\" = true, \\"hardwareId\\" = 'LINUX-X64-NODE-MACHINE';
            "
        done
        
        echo "\\n=== 6. Mengupdate .env backend VPS agar menggunakan vamos_pos ==="
        # Ubah database_url di .env backend ke vamos_pos
        ENV_PATH="/var/www/vamos/vamos-pos-backend/.env"
        if [ -f "$ENV_PATH" ]; then
            sed -i 's/vamos_pos_db/vamos_pos/g' "$ENV_PATH"
            echo "Isi .env baru:"
            cat "$ENV_PATH"
            echo "Merestart backend..."
            pm2 restart vamos-backend
        else
            echo "⚠️ File .env backend tidak ditemukan di $ENV_PATH"
        fi
        
        echo "\\n=== Daftar Database Sekarang ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c "\\\\l"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);
