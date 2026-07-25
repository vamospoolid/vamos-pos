const { Client } = require('ssh2');
const conn = new Client();

const VPS = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07', readyTimeout: 30000 };

conn.on('ready', () => {
    console.log('✅ SSH Connected\n');

    const cmd = `
echo "=== CARI SEMUA VamosPlayer.apk DI SERVER ===" && \
find /var/www -name "VamosPlayer*.apk" -o -name "vamosplayer*.apk" 2>/dev/null | xargs ls -lh 2>/dev/null && \
echo "" && \
echo "=== STRUKTUR FOLDER VAMOS ===" && \
ls -lh /var/www/vamos-pos/ 2>/dev/null || echo "TIDAK ADA /var/www/vamos-pos/" && \
ls -lh /var/www/ && \
echo "" && \
echo "=== CEK NGINX CONFIG (APK serving) ===" && \
grep -r "VamosPlayer\\|apk\\|\\.apk" /etc/nginx/sites-enabled/ 2>/dev/null | head -20 && \
echo "" && \
echo "=== ROOT DIR NGINX ===" && \
grep -r "root " /etc/nginx/sites-enabled/ 2>/dev/null | head -10
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('❌', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\n--- SELESAI ---'); conn.end(); });
    });
}).connect(VPS);
