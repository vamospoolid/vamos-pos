const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000,
};

const conn = new Client();

console.log('Menghubungkan ke VPS 173.212.243.240 untuk setup SSL (HTTPS)...');

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    // Command install certbot dan request sertifikat untuk 4 subdomain
    const cmd = `
        echo "=== 1. INSTALL CERTBOT ==="
        apt-get update
        apt-get install -y certbot python3-certbot-nginx

        echo "\\n=== 2. REQUEST SERTIFIKAT SSL (HTTPS) ==="
        # Kita daftarkan ke-4 subdomain secara otomatis menggunakan Certbot Nginx plugin
        certbot --nginx \\
            -d pos.vamospool.id \\
            -d app.vamospool.id \\
            -d admin.vamospool.id \\
            -d api.vamospool.id \\
            --non-interactive \\
            --agree-tos \\
            -m ahmaddcc07@gmail.com \\
            --redirect
            
        echo "\\n=== 3. RESTART NGINX ==="
        systemctl restart nginx
        
        echo "\\n🎉 SETUP SSL SELESAI!"
        echo "Sekarang akses ke https://pos.vamospool.id tidak akan error merah lagi!"
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
