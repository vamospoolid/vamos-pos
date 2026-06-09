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
    conn.exec('ls /etc/nginx/sites-enabled', (err, stream) => {
        stream.on('data', (data) => console.log("Sites enabled:", data.toString()));
        stream.on('close', () => {
             conn.exec('cat /etc/nginx/sites-enabled/vamos', (err2, stream2) => {
                 stream2.on('data', (data) => console.log("Vamos config:\n", data.toString()));
                 stream2.on('close', () => conn.end());
             });
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
