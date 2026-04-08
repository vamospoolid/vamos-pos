const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        
        echo "=== Cek isi dist/ ==="
        ls -la /var/www/vamos-pos/vamos-player-app/dist/
        
        echo "=== Cek apakah App.tsx perubahan sudah ada di build ==="
        grep -c "VamosPlayer.apk" /var/www/vamos-pos/vamos-player-app/dist/assets/*.js 2>/dev/null || echo "NOT FOUND - perlu rebuild!"
        
        echo "=== Rebuild vamos-player-app ==="
        cd /var/www/vamos-pos/vamos-player-app
        npm run build
        
        echo "=== Cek lagi setelah rebuild ==="
        grep -c "VamosPlayer.apk" /var/www/vamos-pos/vamos-player-app/dist/assets/*.js 2>/dev/null && echo "OK - APK link ditemukan di build!"
        
        echo "=== Reload Nginx ==="
        nginx -s reload && echo "Nginx reloaded OK!"
        
        echo "=== SELESAI ==="
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\nDone!'); conn.end(); });
    });
}).connect({ host: '5.189.165.222', port: 22, username: 'root', password: 'Ahmaddcc07' });
