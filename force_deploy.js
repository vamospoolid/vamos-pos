const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

// Files yang berubah — langsung upload tanpa perlu GitHub
const LOCAL_BASE = path.join(__dirname, 'vamos-pos-backend');
const CHANGED_FILES = [
    'src/modules/player/player.controller.ts',
    'src/modules/loyalty/loyalty.service.ts',
];

conn.on('ready', () => {
    console.log('✅ SSH Connected ke VPS!\n');
    
    // Step 1: Cari path backend di VPS
    conn.exec('find /var/www /root /home -maxdepth 4 -type d -name "vamos-pos-backend" 2>/dev/null', (err, stream) => {
        if (err) throw err;
        let paths = '';
        stream.on('data', (data) => paths += data);
        stream.on('close', () => {
            const lines = paths.trim().split('\n').filter(l => l.trim());
            if (lines.length === 0) {
                console.error('❌ vamos-pos-backend tidak ditemukan di VPS!');
                return conn.end();
            }

            const backendPath = lines[0].trim();
            console.log(`📁 Backend ditemukan di: ${backendPath}\n`);

            // Step 2: Upload changed files via SFTP
            conn.sftp((err, sftp) => {
                if (err) throw err;

                let uploaded = 0;
                const total = CHANGED_FILES.length;

                function uploadNext(index) {
                    if (index >= total) {
                        sftp.end();
                        console.log(`\n✅ ${uploaded}/${total} file berhasil diupload!\n`);
                        buildAndRestart(backendPath);
                        return;
                    }

                    const relPath = CHANGED_FILES[index];
                    const localFile = path.join(LOCAL_BASE, relPath);
                    const remoteFile = `${backendPath}/${relPath}`;
                    const remoteDir = path.dirname(remoteFile);

                    console.log(`📤 Uploading: ${relPath}`);

                    // Ensure remote dir exists
                    conn.exec(`mkdir -p ${remoteDir}`, (e, s) => {
                        s.on('close', () => {
                            const localContent = fs.readFileSync(localFile);
                            const writeStream = sftp.createWriteStream(remoteFile);

                            writeStream.on('close', () => {
                                console.log(`   ✓ Done (${(localContent.length / 1024).toFixed(1)} KB)`);
                                uploaded++;
                                uploadNext(index + 1);
                            });

                            writeStream.on('error', (e) => {
                                console.error(`   ❌ Failed: ${e.message}`);
                                uploadNext(index + 1);
                            });

                            writeStream.write(localContent);
                            writeStream.end();
                        });
                        s.resume();
                    });
                }

                uploadNext(0);
            });

            // Step 3: Build & restart backend on VPS
            function buildAndRestart(backendPath) {
                console.log('🔨 Building & Restarting backend di VPS...\n');

                const buildCmd = `
                    source ~/.bashrc 2>/dev/null || true
                    source ~/.nvm/nvm.sh 2>/dev/null || true
                    export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
                    
                    cd ${backendPath}
                    echo "==> npm run build..."
                    npm run build 2>&1
                    
                    echo "==> pm2 restart..."
                    pm2 restart all 2>&1 || npx pm2 restart all 2>&1
                    
                    echo ""
                    echo "=== DEPLOYMENT COMPLETE! ==="
                `;

                conn.exec(buildCmd, (err2, stream2) => {
                    if (err2) throw err2;
                    stream2.on('data', (d) => process.stdout.write(d.toString()));
                    stream2.stderr.on('data', (d) => process.stderr.write(d.toString()));
                    stream2.on('close', (code) => {
                        if (code === 0 || code === null) {
                            console.log('\n🚀 Deploy selesai! Backend sudah update di VPS.\n');
                        } else {
                            console.log(`\n⚠️  Build selesai dengan code ${code}. Cek log di atas.\n`);
                        }
                        conn.end();
                    });
                });
            }
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect({
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07',
    readyTimeout: 15000,
});
