const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('curl -s http://127.0.0.1/ | grep -o "assets/index-[A-Za-z0-9_-]*.js"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '5.189.165.222',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
});
