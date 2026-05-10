const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

const localApk = 'd:\\APPS\\vamosmobile\\VamosPlayer_v3_GUI_Update.apk';
const remoteApk = '/var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk';

conn.on('ready', () => {
    console.log('✅ SSH Connected untuk Upload APK!\n');

    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log(`🚀 Uploading APK...`);
        console.log(`   Local: ${localApk}`);
        console.log(`   Remote: ${remoteApk}`);
        
        sftp.fastPut(localApk, remoteApk, (err) => {
            if (err) {
                console.error('❌ Upload failed:', err);
            } else {
                console.log('✅ APK uploaded successfully to VPS!');
            }
            conn.end();
        });
    });
}).connect(config);
