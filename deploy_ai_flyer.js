const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };
const LOCAL_FRONTEND_DIST = 'd:\\APPS\\vamosmobile\\vamos-pos-frontend\\dist';
const LOCAL_BACKEND = 'd:\\APPS\\vamosmobile\\vamos-pos-backend\\dist';

async function uploadDirectory(sftp, localDir, remoteDir) {
    const items = fs.readdirSync(localDir);
    
    // Create remote dir
    await new Promise((res, rej) => sftp.mkdir(remoteDir, err => { if (err && err.code !== 4) rej(err); else res(); }));
    
    for (const item of items) {
        const localPath = path.join(localDir, item);
        const remotePath = `${remoteDir}/${item}`;
        const stat = fs.statSync(localPath);
        
        if (stat.isDirectory()) {
            await uploadDirectory(sftp, localPath, remotePath);
        } else {
            await new Promise((res, rej) => {
                sftp.fastPut(localPath, remotePath, err => err ? rej(err) : res());
            });
        }
    }
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('🔗 Terhubung ke VPS...');

    // Step 1: Upload backend dist
    console.log('\n📦 Step 1: Upload backend dist ke VPS...');
    const sftp1 = await new Promise((res, rej) => conn.sftp((err, s) => err ? rej(err) : res(s)));
    await uploadDirectory(sftp1, LOCAL_BACKEND, '/var/www/vamos/vamos-pos-backend/dist');
    console.log('✅ Backend dist uploaded!');

    // Step 2: Upload frontend dist
    console.log('\n🎨 Step 2: Upload frontend dist ke VPS...');
    const sftp2 = await new Promise((res, rej) => conn.sftp((err, s) => err ? rej(err) : res(s)));
    await uploadDirectory(sftp2, LOCAL_FRONTEND_DIST, '/var/www/vamos/vamos-pos-frontend/dist');
    console.log('✅ Frontend dist uploaded!');

    // Step 3: Install @google/generative-ai on VPS backend
    console.log('\n🤖 Step 3: Install Gemini SDK di VPS backend...');
    await new Promise((res, rej) => {
        conn.exec('cd /var/www/vamos/vamos-pos-backend && npm install @google/generative-ai --save 2>&1', (err, stream) => {
            if (err) return rej(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', res);
        });
    });
    console.log('✅ Gemini SDK installed!');

    // Step 4: Add GEMINI_API_KEY placeholder to VPS .env if not exists
    console.log('\n🔑 Step 4: Cek GEMINI_API_KEY di .env VPS...');
    await new Promise((res, rej) => {
        const cmd = `grep -q "GEMINI_API_KEY" /var/www/vamos/vamos-pos-backend/.env || echo "\\nGEMINI_API_KEY=MASUKKAN_API_KEY_ANDA_DISINI" >> /var/www/vamos/vamos-pos-backend/.env && echo "done"`;
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', res);
        });
    });

    // Step 5: Restart backend
    console.log('\n🔄 Step 5: Restart PM2 backend...');
    await new Promise((res, rej) => {
        conn.exec('pm2 restart vamos-backend && pm2 status', (err, stream) => {
            if (err) return rej(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', res);
        });
    });

    console.log('\n🎉 DEPLOY SELESAI! Semua perubahan AI Flyer Generator sudah live di VPS.');
    console.log('🔑 PENTING: Masukkan Gemini API Key Anda ke /var/www/vamos/vamos-pos-backend/.env di baris GEMINI_API_KEY=');
    console.log('🌐 Buka https://pos.vamospool.id dan cek menu Competitions > Flyer button');
    conn.end();
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS);
