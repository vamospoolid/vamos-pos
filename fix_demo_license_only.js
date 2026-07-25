const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000 // Menambah waktu timeout agar tidak terputus
};

const hwid = "LINUX-X64-NODE-MACHINE";

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mengaktifkan lisensi mesin: ' + hwid + ' ...\n');
    
    const cmd = `
        echo "Memasukkan lisensi ke database vamosdemo_db..."
        sudo -u postgres psql -d vamosdemo_db -c "
            INSERT INTO \\"License\\" (id, \\"licenseKey\\", \\"hardwareId\\", \\"isActivated\\", \\"isActive\\", \\"createdAt\\") 
            VALUES ('demo-license-001', 'DEMO-12345', '${hwid}', true, true, NOW())
            ON CONFLICT (\\"licenseKey\\") DO UPDATE 
            SET \\"hardwareId\\" = '${hwid}', \\"isActivated\\" = true;
            
            UPDATE \\"License\\" SET \\"hardwareId\\" = '${hwid}', \\"isActivated\\" = true, \\"isActive\\" = true;
        " 2>/dev/null || echo "Gagal mengupdate database, abaikan."
        
        echo "Restarting backend..."
        pm2 restart vamosdemo-backend
        echo "\\n🎉 SELESAI! Silakan Refresh (F5) halaman POS di browser Anda."
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err);
}).connect(config);
