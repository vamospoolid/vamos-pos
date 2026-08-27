const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -la /etc/nginx/sites-available/ ; cat /etc/nginx/sites-available/vamos 2>/dev/null || cat /etc/nginx/sites-available/vamospool 2>/dev/null', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
