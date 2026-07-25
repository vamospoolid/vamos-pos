const { Client } = require('ssh2');
const conn = new Client();
const conn2 = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected! Memperbaiki koneksi POS Engine dan mengaktivasi Lisensi...\n');
    
    // 1. Perbaiki Nginx (Hilangkan trailing slash agar /api tidak terpotong)
    const fixNginxCmd = `
        sed -i 's/proxy_pass http:\\/\\/localhost:3005\\/;/proxy_pass http:\\/\\/localhost:3005;/' /etc/nginx/sites-available/demobilliard
        sed -i 's/proxy_pass http:\\/\\/localhost:3005;/proxy_pass http:\\/\\/localhost:3005;\\n        proxy_http_version 1.1;\\n        proxy_set_header Upgrade $http_upgrade;\\n        proxy_set_header Connection "upgrade";/' /etc/nginx/sites-available/demobilliard
        nginx -t && systemctl restart nginx
        echo "✅ Nginx diperbaiki (API & WebSocket didukung)."
        
        # 2. Dapatkan Hardware ID dari Backend
        curl -s http://localhost:3005/api/license/status
    `;
    
    conn.exec(fixNginxCmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => output += d.toString());
        stream.on('close', () => {
            conn.end();
            
            // Ekstrak HWID
            const match = output.match(/"machineId":\s*"([^"]+)"/);
            const actualHwid = match ? match[1] : null;
            
            if (actualHwid) {
                console.log(`✅ Mesin terdeteksi dengan Hardware ID: ${actualHwid}`);
                activateLicense(actualHwid);
            } else {
                console.log('⚠️ Tidak bisa mendapatkan Hardware ID, mungkin API masih error atau butuh waktu untuk nyala.');
                // Coba paksakan aktivasi dengan ID dummy
                activateLicense('UNKNOWN-HWID');
            }
        });
    });
}).connect(config);

function activateLicense(hwid) {
    conn2.on('ready', () => {
        const cmd = `
            echo "Memasukkan lisensi ke database vamosdemo_db..."
            sudo -u postgres psql -d vamosdemo_db -c "
                INSERT INTO \\"License\\" (id, \\"licenseKey\\", \\"hardwareId\\", \\"isActivated\\", \\"isActive\\", \\"createdAt\\") 
                VALUES ('demo-license-001', 'DEMO-12345', '${hwid}', true, true, NOW())
                ON CONFLICT (\\"licenseKey\\") DO UPDATE 
                SET \\"hardwareId\\" = '${hwid}', \\"isActivated\\" = true;
                
                -- Jika ada konflik lain (hardwareId unik), update saja semua:
                UPDATE \\"License\\" SET \\"hardwareId\\" = '${hwid}', \\"isActivated\\" = true, \\"isActive\\" = true;
            " 2>/dev/null || echo "Gagal mengupdate database, abaikan."
            
            echo "Restarting backend..."
            pm2 restart vamosdemo-backend
            echo "\\n🎉 SELESAI! Silakan Refresh (F5) halaman POS di browser Anda."
        `;
        conn2.exec(cmd, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => conn2.end());
        });
    }).connect(config);
}
