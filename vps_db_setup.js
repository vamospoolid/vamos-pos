const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected untuk Setup Database!');
    
    const dbCmd = `
        # 1. Instal PostgreSQL
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib

        # 2. Start & Enable PostgreSQL
        sudo systemctl start postgresql
        sudo systemctl enable postgresql

        # 3. Buat Database dan User (SQL)
        sudo -u postgres psql -c "CREATE DATABASE vamos_db;"
        sudo -u postgres psql -c "CREATE USER vamos_user WITH PASSWORD 'vamos_password123';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vamos_db TO vamos_user;"
        sudo -u postgres psql -d vamos_db -c "GRANT ALL ON SCHEMA public TO vamos_user;"

        # 4. Buat file .env di Backend
        echo "📝 Creating .env file in backend..."
        cat <<EOT > /var/www/vamos-pos/vamos-pos-backend/.env
DATABASE_URL="postgresql://vamos_user:vamos_password123@localhost:5432/vamos_db?schema=public"
JWT_SECRET="vamos_secret_key_2026"
PORT=3000
NODE_ENV="production"
EOT

        # 5. Jalankan Prisma Migration
        echo "🔄 Running Prisma Migration..."
        cd /var/www/vamos-pos/vamos-pos-backend
        npx prisma generate
        npx prisma migrate deploy

        # 6. Jalankan Seed (Mode Reset Database Anda)
        echo "🌱 Running Seed / Database Reset..."
        # Sesuaikan dengan script seed Anda, biasanya:
        npm run seed || npx prisma db seed || echo "⚠️ Seed script failed or not found, continuing..."

        echo ""
        echo "=========================================="
        echo "✅ DATABASE SETUP COMPLETE!"
        echo "DB Name: vamos_db"
        echo "DB User: vamos_user"
        echo "=========================================="
    `;

    conn.exec(dbCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log(`\n🚀 Proses selesai dengan exit code: ${code}`);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
