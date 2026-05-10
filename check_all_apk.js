const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== Semua APK di vamos-player-app ==="',
        'find /var/www/vamos-pos/vamos-player-app -name "*.apk" -ls 2>/dev/null',
        'echo "=== Check download URL content-length ==="',
        'curl -s -I https://app.vamospool.id/VamosPlayer.apk | grep -i "content-length"',
        'echo "=== APK baru harusnya 12390542 bytes ==="'
    ].join(' && ');
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
