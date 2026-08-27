const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -rn "server_name" /etc/nginx/sites-enabled/ ; ls -la /var/www/vamos', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
