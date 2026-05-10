const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

conn.on('ready', () => {
    conn.exec('grep ".apk" /var/www/vamos-pos/vamos-player-app/dist/index.html', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
