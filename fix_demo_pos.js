const { Client } = require('ssh2');

const conn = new Client();
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const commands = [
    // 1. Ubah konfigurasi Nginx dari player-app ke pos-frontend
    "echo '==== 1. Mengubah Nginx ke POS Frontend ===='",
    "sed -i 's/vamos-player-app/vamos-pos-frontend/g' /etc/nginx/sites-available/demobilliard",

    // 2. Update .env Frontend POS untuk mengarah ke API demo (bukan API production)
    "echo '\\n==== 2. Update .env POS Frontend ===='",
    "echo 'VITE_API_URL=http://demobilliard.codenusa.id/api' > /var/www/vamosdemo/vamos-pos-frontend/.env",

    // 3. Build Ulang Frontend POS di VPS
    "echo '\\n==== 3. Build POS Frontend (Mohon tunggu, ini butuh waktu sekitar 1 menit) ===='",
    "cd /var/www/vamosdemo/vamos-pos-frontend && npm install && npm run build",

    // 4. Restart Nginx
    "echo '\\n==== 4. Restart Nginx ===='",
    "nginx -t && systemctl restart nginx",

    // 5. Jalankan Seeder Database (Agar ada data dummy Admin, Meja, dll di versi Demo)
    "echo '\\n==== 5. Menjalankan Database Seeder ===='",
    "cd /var/www/vamosdemo/vamos-pos-backend && npm run seed || npm run seed:all || echo 'Seeder gagal atau tidak ditemukan'",

    "echo '\\n✅ SETUP DEMO POS SELESAI! Silakan akses http://demobilliard.codenusa.id'"
];

conn.on('ready', () => {
    console.log('✅ SSH Connected!\nMemperbaiki Demo menjadi POS System...\n');
    
    const runCommand = (cmdIndex) => {
        if (cmdIndex >= commands.length) {
            console.log('\\n✅ Seluruh Script Node Selesai Dieksekusi.');
            conn.end();
            return;
        }

        const cmd = commands[cmdIndex];
        conn.exec(cmd, (err, stream) => {
            if (err) {
                console.error('❌ Error:', err);
                conn.end();
                return;
            }
            stream.on('close', (code, signal) => {
                runCommand(cmdIndex + 1);
            }).on('data', (data) => {
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stdout.write(data); 
            });
        });
    };

    runCommand(0);
}).on('error', (err) => {
    console.error('❌ SSH Error:', err);
}).connect(config);
