const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('curl -s http://127.0.0.1:4005/api/qr/menu/3a17ce5c-0283-446e-98a6-8ffef3e3a983 | jq ".success, .data.table.name, (.data.products | length)"', (err, stream) => {
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
