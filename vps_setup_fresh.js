const { Client } = require('ssh2');

const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS Baru!');
    console.log('🚀 Memulai proses instalasi dependensi (Ubuntu)...\n');

    const setupCmd = `
        # 1. Update OS
        sudo apt update -y
        
        # 2. Instal Node.js 20 LTS
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs git build-essential
        
        # 3. Instal PM2 & Serve
        sudo npm install -g pm2 serve
        
        # 4. Siapkan Folder Project
        sudo mkdir -p /var/www
        sudo chown -R root:root /var/www
        cd /var/www
        
        # 5. Clone Repository (Hapus jika sudah ada)
        sudo rm -rf vamos-pos
        git clone https://github.com/vamospoolid/vamos-pos.git
        
        # 6. Install Backend Dependencies
        echo "📦 Installing Backend Dependencies..."
        cd /var/www/vamos-pos/vamos-pos-backend
        npm install
        
        # 7. Install Frontend Dependencies
        echo "📦 Installing Frontend Dependencies..."
        cd /var/www/vamos-pos/vamos-pos-frontend
        npm install
        
        # 8. Install Player App Dependencies
        echo "📦 Installing Player App Dependencies..."
        cd /var/www/vamos-pos/vamos-player-app
        npm install

        echo ""
        echo "=========================================="
        echo "✅ SETUP BERHASIL!"
        echo "Node: $(node -v)"
        echo "NPM: $(npm -v)"
        echo "Project: /var/www/vamos-pos"
        echo "=========================================="
    `;

    conn.exec(setupCmd, (err, stream) => {
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
