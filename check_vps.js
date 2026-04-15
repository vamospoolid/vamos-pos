const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -i "DEBUG MODE" /var/www/vamos-pos/vamos-pos-frontend/src/Members.tsx', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '5.189.165.222',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
});
