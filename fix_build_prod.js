const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected! Memperbaiki Error Build di Production...\n');
    
    const cmd = `
        echo "1. Memperbaiki konfigurasi WhatsApp (Menghapus opsi remote yang tidak lengkap)..."
        cd /var/www/vamos/vamos-pos-backend
        
        # Hapus blok webVersionCache sepenuhnya agar library menggunakan default Local (paling aman & stabil)
        sed -i "/webVersionCache:/,/},/d" src/modules/whatsapp/wa.service.ts
        
        echo "2. Memperbaiki masalah Prisma Client (timezoneOffset)..."
        # Men-generate ulang Prisma Client agar membaca versi schema terbaru di Production
        npx prisma generate
        
        echo "3. Build ulang & Restart Production Backend..."
        npm run build
        
        if [ $? -eq 0 ]; then
            echo "✅ Build Berhasil!"
            pm2 restart vamos-backend
            echo "🎉 SELESAI! Production Backend sudah aktif kembali."
        else
            echo "❌ Build masih gagal. Harap periksa log error di atas."
        fi
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
