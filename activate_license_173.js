const { Client } = require('ssh2');

const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const conn = new Client();
conn.on('ready', () => {
    // Panggil API license/status untuk lihat hwid yang dihasilkan VPS
    const cmd = `
        echo "=== Hardware ID yang dihasilkan VPS ==="
        curl -s http://localhost:4005/api/license/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:4005/api/license/status
        
        echo ""
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => { output += d.toString(); process.stdout.write(d.toString()); });
        stream.on('close', () => {
            // Extract machineId from output
            const match = output.match(/"machineId":\s*"([^"]+)"/);
            const actualHwid = match ? match[1] : null;
            
            if (actualHwid) {
                console.log(`\n✅ Hardware ID VPS: ${actualHwid}`);
                console.log('🔄 Mengupdate database dengan Hardware ID yang benar...');
                updateLicense(actualHwid);
            } else {
                console.log('\n⚠️  Tidak bisa baca machineId. Coba cek endpoint manual.');
                conn.end();
            }
        });
    });
}).on('error', err => console.error('❌ Error:', err.message)).connect(VPS_BARU);

function updateLicense(actualHwid) {
    const conn2 = new Client();
    conn2.on('ready', () => {
        const cmd = `
            echo "=== Update hardwareId di database ==="
            PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "
                UPDATE \\"License\\" 
                SET \\"hardwareId\\" = '${actualHwid}', \\"isActivated\\" = true, \\"isActive\\" = true
                WHERE id = 'vamos-cloud-license-001';
                
                SELECT id, \\"hardwareId\\", \\"isActivated\\", \\"isActive\\" FROM \\"License\\";
            " 2>&1
            
            echo "\\n=== Restart Backend ==="
            pm2 restart vamos-backend --update-env
            sleep 3
            
            echo "\\n=== Verifikasi API ==="
            curl -s http://localhost:4005/api/license/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:4005/api/license/status
            echo "\\n🎉 SELESAI! Refresh browser Anda sekarang."
        `;
        conn2.exec(cmd, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn2.end());
        });
    }).on('error', err => console.error(err.message)).connect(VPS_BARU);
}
