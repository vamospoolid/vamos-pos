const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -rn "proxy_pass" /etc/nginx/', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
