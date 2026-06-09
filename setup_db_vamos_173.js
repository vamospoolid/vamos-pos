const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

const conn = new Client();

console.log('Menghubungkan ke VPS untuk setup Database Vamos...');

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    // Command to check postgres, create DB, update .env, and push prisma schema
    const cmd = `
        echo "=== 1. CEK POSTGRESQL ==="
        if ! command -v psql &> /dev/null
        then
            echo "❌ PostgreSQL belum terinstall di VPS ini!"
            exit 1
        fi
        
        echo "=== 2. MEMBUAT DATABASE VAMOS ==="
        # Kita buat database dengan nama 'vamos_pos_db' dan user 'postgres' (asumsi tanpa password untuk root lokal)
        # Jika postgres memiliki password 'postgres', sesuaikan. Optik biasanya pakai user postgres pass postgres.
        sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'vamos_pos_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE vamos_pos_db;"
        echo "✅ Database 'vamos_pos_db' dipastikan ada."

        echo "\\n=== 3. UPDATE .ENV BACKEND ==="
        # Menimpa .env dengan URL DB yang benar
        cat << 'EOF' > /var/www/vamos/vamos-pos-backend/.env
PORT=4005
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vamos_pos_db?schema=public
EOF
        echo "✅ File .env berhasil diupdate dengan DATABASE_URL."

        echo "\\n=== 4. MIGRASI STRUKTUR DATABASE (PRISMA) ==="
        cd /var/www/vamos/vamos-pos-backend
        echo "-> Menjalankan npx prisma db push..."
        # Gunakan bash interaktif untuk nvm jika perlu
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        npx prisma db push --accept-data-loss
        
        echo "\\n=== 5. RESTART BACKEND ==="
        pm2 restart vamos-backend
        pm2 save
        echo "✅ Proses Setup Database Selesai!"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\\n🔌 Exit code:', code);
            conn.end();
        });
    });
}).on('error', err => console.error('❌ SSH Error:', err.message)).connect(VPS_CONFIG);
