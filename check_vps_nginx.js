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
    conn.exec('cat /etc/nginx/sites-available/vamos-pos', (err, stream) => {
        if (err) {
            conn.exec('ls /etc/nginx/sites-available', (err2, stream2) => {
                stream2.on('data', (data) => console.log("Sites available:", data.toString()));
                stream2.on('close', () => conn.end());
            });
            return;
        }
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
