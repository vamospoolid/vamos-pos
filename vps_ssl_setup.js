const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected untuk Setup SSL!');
    
    // Perintah untuk instal certbot dan mendaftarkan SSL
    // Kita gunakan --nginx agar certbot otomatis mengedit file konfigurasi nginx kita
    const sslCmd = `
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
        
        # Mendaftarkan SSL untuk semua subdomain sekaligus
        # --non-interactive: Jangan tanya-tanya di tengah proses
        # --agree-tos: Setuju dengan aturan Let's Encrypt
        # -m: Email untuk notifikasi renewal (saya pakai email dummy, bisa diganti nanti)
        sudo certbot --nginx -d api.vamospool.id -d pos.vamospool.id -d app.vamospool.id -d admin.vamospool.id --non-interactive --agree-tos -m ahmad@vamospool.id --redirect
        
        # Cek status auto-renewal
        sudo systemctl status certbot.timer
    `;

    conn.exec(sslCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log(`\n🚀 Proses SSL selesai dengan exit code: ${code}`);
            if (code === 0) {
                console.log("==========================================");
                console.log("✅ SSL BERHASIL DIPASANG!");
                console.log("Semua domain sekarang menggunakan HTTPS.");
                console.log("==========================================");
            } else {
                console.log("⚠️ Ada kemungkinan DNS belum tersebar sepenuhnya.");
                console.log("Coba jalankan lagi script ini dalam 5-10 menit.");
            }
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
