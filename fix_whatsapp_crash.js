const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mem-patch WhatsApp Engine di VPS...\n');
    
    const cmd = `
        echo "1. Mengubah webVersionCache di wa.service.ts..."
        cd /var/www/vamosdemo/vamos-pos-backend
        
        # Ganti type: 'none' menjadi type: 'remote' agar tidak dipaksa menggunakan versi terbaru yang mungkin error
        sed -i "s/type: 'none'/type: 'remote'/g" src/modules/whatsapp/wa.service.ts
        
        # Tambahkan opsi tambahan untuk Puppeteer agar lebih stabil di Linux
        sed -i "/'--disable-gpu'/a \\                    ,'--disable-setuid-sandbox'\\n                    ,'--no-sandbox'\\n                    ,'--disable-accelerated-2d-canvas'\\n                    ,'--disable-dev-shm-usage'" src/modules/whatsapp/wa.service.ts
        
        echo "2. Memperbarui whatsapp-web.js ke versi terbaru..."
        npm install whatsapp-web.js@latest
        
        echo "3. Build ulang & Restart..."
        npm run build
        pm2 restart vamosdemo-backend
        
        echo "🎉 SELESAI! WhatsApp Engine sudah di-patch."
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
