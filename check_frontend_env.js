const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    conn.exec('cat /var/www/vamos-pos/vamos-pos-frontend/.env', (err, stream) => {
        stream.on('data', (data) => console.log(".env content:\n", data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
