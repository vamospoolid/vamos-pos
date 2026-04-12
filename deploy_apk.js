const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localFile = path.join(__dirname, 'vamos-player-app', 'VamosPlayer.apk');

const remotePaths = [
    '/var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk',
    '/var/www/vamos-pos/vamos-pos-backend/public/VamosPlayer.apk',
    '/var/www/vamos-pos/vamos-player-app/public/VamosPlayer.apk'
];

conn.on('ready', () => {
    console.log('SSH Connection Ready...');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        let completed = 0;
        
        const uploadNext = (index) => {
            if (index >= remotePaths.length) {
                console.log('All uploads completed successfully.');
                conn.end();
                return;
            }

            const remotePath = remotePaths[index];
            console.log(`Uploading to ${remotePath}...`);
            
            sftp.fastPut(localFile, remotePath, (err) => {
                if (err) {
                    console.error(`Failed to upload to ${remotePath}:`, err);
                } else {
                    console.log(`Successfully uploaded to ${remotePath}`);
                }
                uploadNext(index + 1);
            });
        };

        uploadNext(0);
    });
}).connect({
    host: '5.189.165.222',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
});
