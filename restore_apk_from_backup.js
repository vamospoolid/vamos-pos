const { Client } = require('ssh2');
const conn = new Client();

// Instead of uploading, copy from existing backup on VPS
// The old APK (12.7MB) is at /var/www/vamos-pos/vamos-player-app/public/VamosPlayer.apk
// The new APK was deployed via dist. Let's check what's currently in dist
// and copy back from the old deploy if needed

conn.on('ready', () => {
    const cmd = [
        'echo "=== Cek APK di dist sekarang ==="',
        'ls -lh /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk 2>/dev/null || echo "NOT FOUND"',
        'echo "=== Cek backup APK ==="',
        'ls -lh /var/www/vamos-pos/vamos-player-app/VamosPlayer.apk 2>/dev/null || echo "backup not found"',
        'ls -lh /var/www/vamos-pos/vamos-player-app/public/VamosPlayer.apk 2>/dev/null || echo "public not found"',
        'echo "=== Copy APK dari backup ke dist ==="',
        // Use the one we previously uploaded (12390542 bytes = new APK)
        // It should be in the VPS root of vamos-player-app
        'if [ -f /var/www/vamos-pos/vamos-player-app/VamosPlayer.apk ]; then cp /var/www/vamos-pos/vamos-player-app/VamosPlayer.apk /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk && echo "Copied from root backup" && ls -lh /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk; else echo "No backup found, using public version"; cp /var/www/vamos-pos/vamos-player-app/public/VamosPlayer.apk /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk 2>/dev/null && ls -lh /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk; fi',
        'echo "=== Verifikasi ==="',
        'curl -s -I https://app.vamospool.id/VamosPlayer.apk | grep -E "HTTP|Content-Length"'
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
