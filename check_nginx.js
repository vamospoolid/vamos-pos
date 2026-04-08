const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check how app.vamospool.id is served - nginx config
    conn.exec(`
        cat /etc/nginx/sites-enabled/app.vamospool.id 2>/dev/null || \
        cat /etc/nginx/sites-enabled/vamos 2>/dev/null || \
        grep -r "app.vamospool" /etc/nginx/ 2>/dev/null || \
        echo "=== CHECKING ALL NGINX CONFIGS ===" && ls /etc/nginx/sites-enabled/
    `, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
            console.log('=== NGINX CONFIG ===');
            console.log(out);
            conn.end();
        });
    });
}).connect({ host: '5.189.165.222', port: 22, username: 'root', password: 'Ahmaddcc07' });
