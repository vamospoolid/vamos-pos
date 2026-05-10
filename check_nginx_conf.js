const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

conn.on('ready', () => {
    conn.exec('cat /etc/nginx/sites-available/vamos-player', (err, stream) => {
        if (err) {
            // Try default or list files
            conn.exec('ls /etc/nginx/sites-available/', (err2, stream2) => {
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.on('close', () => conn.end());
            });
            return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
