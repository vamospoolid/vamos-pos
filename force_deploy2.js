const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('SSH OK. Mencari PATH node/npm di server...');

    // Step 1: Cari path npm yang benar di server
    conn.exec('which node || find /usr/local/bin /root/.nvm -name "npm" 2>/dev/null | head -5', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
            console.log('Node paths found:', out.trim());

            // Step 2: Jalankan deploy dengan PATH lengkap
            const deployCmd = `
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
                export PATH=$PATH:/usr/local/bin:/usr/bin
                
                echo "=== Node version: $(node -v) ==="
                echo "=== NPM version: $(npm -v) ==="
                
                cd /var/www/vamos-pos/vamos-player-app
                echo "=== Installing deps if needed... ==="
                npm install --legacy-peer-deps
                
                echo "=== Building Player App... ==="
                npm run build
                
                echo "=== Checking build output... ==="
                ls -la dist/
                
                echo "=== Copying build to backend public... ==="
                rm -rf /var/www/vamos-pos/vamos-pos-backend/public/player
                mkdir -p /var/www/vamos-pos/vamos-pos-backend/public/player
                cp -r dist/* /var/www/vamos-pos/vamos-pos-backend/public/player/
                
                echo "=== Build done! Restarting PM2... ==="
                pm2 restart all --update-env
                pm2 list
                echo "=== SELESAI ==="
            `;

            conn.exec(deployCmd, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                stream2.on('close', (code) => {
                    console.log('\nExit code:', code);
                    conn.end();
                });
            });
        });
    });
}).on('error', err => console.error('SSH Error:', err))
.connect({ host: '5.189.165.222', port: 22, username: 'root', password: 'Ahmaddcc07' });
