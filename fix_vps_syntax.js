const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07', readyTimeout: 30000 };

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mengirim file Settings.tsx lokal yang benar ke VPS...\n');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localFile = 'd:\\\\APPS\\\\vamosmobile\\\\vamos-pos-frontend\\\\src\\\\Settings.tsx';
        const remoteFile = '/var/www/vamos/vamos-pos-frontend/src/Settings.tsx';
        
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('✅ Berhasil menyalin Settings.tsx ke VPS. Memulai ulang build...\n');
            
            const cmd = `
                cd /var/www/vamos/vamos-pos-frontend
                npm run build
            `;
            
            conn.exec(cmd, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\\n🎉 BUILD SELESAI!');
                    conn.end();
                });
            });
        });
    });
}).connect(config);
