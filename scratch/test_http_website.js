const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec("curl -I -H 'Host: vamospool.id' http://127.0.0.1", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
