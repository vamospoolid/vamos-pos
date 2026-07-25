const { Client } = require('ssh2');

const conn = new Client();
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const commands = [
    // 1. Membersihkan Nginx lama (billiarddemo) jika ada
    "echo '==== 1. Membersihkan Config Nginx Lama ===='",
    "rm -f /etc/nginx/sites-available/billiarddemo /etc/nginx/sites-enabled/billiarddemo",

    // 2. Memperbaiki .env Database URL karena nama aslinya vamos_pos
    "echo '\\n==== 2. Memperbaiki Konfigurasi .env ===='",
    "sed -i 's/vamos_pos/vamosdemo_db/g' /var/www/vamosdemo/vamos-pos-backend/.env",
    "sed -i 's/vamos_db/vamosdemo_db/g' /var/www/vamosdemo/vamos-pos-backend/.env", // fallback

    // 3. Build Backend & Prisma (Pastikan dist/ terbuat)
    "echo '\\n==== 3. Build Backend & Sinkronisasi Database ===='",
    "cd /var/www/vamosdemo/vamos-pos-backend && npm install && npm run build && npx prisma generate && npx prisma db push --accept-data-loss",

    // 4. Start PM2 Backend Demo
    "echo '\\n==== 4. Menjalankan Backend dengan PM2 ===='",
    "cd /var/www/vamosdemo/vamos-pos-backend && (pm2 restart vamosdemo-backend || pm2 start dist/server.js --name \"vamosdemo-backend\") && pm2 save",

    // 5. Setup Nginx untuk demobilliard.codenusa.id
    "echo '\\n==== 5. Setup Nginx untuk demobilliard.codenusa.id ===='",
    `cat << 'EOF' > /etc/nginx/sites-available/demobilliard
server {
    listen 80;
    server_name demobilliard.codenusa.id;

    # Frontend
    location / {
        root /var/www/vamosdemo/vamos-player-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend
    location /api/ {
        proxy_pass http://localhost:3005/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF`,
    "ln -sf /etc/nginx/sites-available/demobilliard /etc/nginx/sites-enabled/",
    "nginx -t && systemctl restart nginx",
    "echo '\\n✅ SETUP SELESAI! Silakan akses http://demobilliard.codenusa.id'"
];

conn.on('ready', () => {
    console.log('✅ SSH Connected!\nMemulai Perbaikan Setup Demo...\n');
    
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
