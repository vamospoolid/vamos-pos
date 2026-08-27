const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec("certbot --nginx -d vamospool.id -d www.vamospool.id --non-interactive --agree-tos --email admin@vamospool.id 2>/dev/null || true", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('Certbot step completed.');
            conn.end();
        });
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
