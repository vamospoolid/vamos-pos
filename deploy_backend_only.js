const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };
const LOCAL_BACKEND = 'd:\\APPS\\vamosmobile\\vamos-pos-backend\\dist';

async function uploadDirectory(sftp, localDir, remoteDir) {
    const items = fs.readdirSync(localDir);
    await new Promise((res, rej) => sftp.mkdir(remoteDir, err => { if (err && err.code !== 4) rej(err); else res(); }));
    for (const item of items) {
        const localPath = path.join(localDir, item);
        const remotePath = `${remoteDir}/${item}`;
        const stat = fs.statSync(localPath);
        if (stat.isDirectory()) {
            await uploadDirectory(sftp, localPath, remotePath);
        } else {
            await new Promise((res, rej) => sftp.fastPut(localPath, remotePath, err => err ? rej(err) : res()));
        }
    }
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('📦 Upload backend dist (model fix: gemini-2.0-flash)...');
    const sftp = await new Promise((res, rej) => conn.sftp((err, s) => err ? rej(err) : res(s)));
    await uploadDirectory(sftp, LOCAL_BACKEND, '/var/www/vamos/vamos-pos-backend/dist');
    console.log('✅ Upload selesai! Merestart backend dengan --update-env...');

    await new Promise((res, rej) => {
        conn.exec('pm2 restart vamos-backend --update-env && pm2 logs vamos-backend --lines 10 --nostream', (err, stream) => {
            if (err) return rej(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', res);
        });
    });

    console.log('\n🎉 Fix deployed! Silakan coba klik "Buat Teks & Prompt dengan AI" lagi di https://pos.vamospool.id');
    conn.end();
}).on('error', err => console.error('❌', err.message)).connect(VPS);
