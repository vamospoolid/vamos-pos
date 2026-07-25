const { Client } = require('ssh2');
const conn = new Client();

const VPS = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07', readyTimeout: 30000 };

conn.on('ready', () => {
    console.log('✅ SSH Connected ke 173.212.243.240\n');

    const cmd = `
echo "=== CEK APK DI SERVER ===" && \
ls -lh /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk 2>/dev/null || echo "TIDAK ADA di dist/" && \
echo "" && \
echo "=== COPY KE PUBLIC BACKEND ===" && \
mkdir -p /var/www/vamos-pos/vamos-pos-backend/public && \
cp /var/www/vamos-pos/vamos-player-app/dist/VamosPlayer.apk /var/www/vamos-pos/vamos-pos-backend/public/VamosPlayer.apk 2>/dev/null && echo "OK: copied ke public" || echo "SKIP: public copy" && \
echo "" && \
echo "=== HTTP HEADER CHECK ===" && \
curl -s -I https://app.vamospool.id/VamosPlayer.apk
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('❌ exec error:', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n✅ Verifikasi selesai.');
            conn.end();
        });
    });
}).connect(VPS);
