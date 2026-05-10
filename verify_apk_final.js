const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== Final check: Header APK dari Nginx ==="',
        'curl -s -I https://app.vamospool.id/VamosPlayer.apk',
        'echo ""',
        'echo "=== Ukuran APK yang diserve (12390542 = baru) ==="',
        'curl -s -I https://app.vamospool.id/VamosPlayer.apk | grep Content-Length'
    ].join(' && ');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
