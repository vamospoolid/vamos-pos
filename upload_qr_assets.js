const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000
};

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const files = [
            'vamos_apk_qr_white.png',
            'vamos_apk_qr_cyan.png',
            'vamos_apk_download_poster.svg'
        ];

        let count = 0;
        files.forEach(file => {
            const localPath = path.join(__dirname, file);
            const remotePath = `/var/www/vamos/vamos-player-app/dist/${file}`;
            
            sftp.fastPut(localPath, remotePath, err => {
                if (err) console.error(`Error uploading ${file}:`, err);
                else console.log(`✅ Uploaded ${file} -> ${remotePath}`);

                count++;
                if (count === files.length) {
                    conn.exec(`
                        cp /var/www/vamos/vamos-player-app/dist/vamos_apk_* /var/www/vamos/vamos-pos-frontend/dist/ 2>/dev/null
                        systemctl reload nginx
                        echo "✅ Nginx reloaded with QR assets!"
                    `, (err, stream) => {
                        if (err) throw err;
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                }
            });
        });
    });
}).connect(config);
