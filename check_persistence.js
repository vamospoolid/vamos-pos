const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
console.log('🛡️ Mengonfigurasi ketahanan server (Auto-start & Backup check)...');

conn.on('ready', () => {
    const cmd = `
        echo "=== 1. Mengaktifkan Autostart PostgreSQL & Nginx ==="
        systemctl enable postgresql 2>&1
        systemctl enable nginx 2>&1
        
        echo "\\n=== 2. Konfigurasi PM2 agar Auto-start saat Server Reboot ==="
        # PM2 Startup command
        pm2 startup | grep -v "re-run" || true
        pm2 save 2>&1
        
        echo "\\n=== 3. Cek Status Perpanjangan Otomatis SSL (Certbot) ==="
        systemctl status certbot.timer | grep -E "Active:|Trigger:" || echo "Certbot timer tidak aktif/tidak terinstal."
        
        echo "\\n=== 4. Cek Cron Job Backup Database ==="
        crontab -l 2>/dev/null || echo "Belum ada cron job backup terdaftar."
        
        echo "\\n=== 5. Status PM2 saat ini ==="
        pm2 list
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);
