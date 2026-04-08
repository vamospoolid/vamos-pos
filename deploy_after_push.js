const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        
        cd /var/www/vamos-pos
        
        echo "=== Step 1: Git pull (stash dulu package-lock) ==="
        git stash
        git pull origin main
        
        echo "=== Step 2: Rebuild player app ==="
        cd vamos-player-app
        npm run build
        
        echo "=== Step 3: Reload Nginx ==="
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
