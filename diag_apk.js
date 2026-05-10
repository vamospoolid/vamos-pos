const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== Cek APK di dist ==="',
        'ls -lh /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk 2>/dev/null || echo "VamosPlayer.apk NOT FOUND"',
        'echo "=== Test curl header APK ==="',
        'curl -s -I https://app.vamospool.id/VamosPlayer.apk | head -15',
        'echo "=== Nginx config player block ==="',
        'grep -A 15 "app.vamospool.id" /etc/nginx/sites-available/vamos | head -20'
    ].join(' && ');
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
