const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        cd /var/www/vamos-pos/vamos-player-app/dist
        ls -la
        ls -la assets
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '5.189.165.222', port: 22, username: 'root', password: 'Ahmaddcc07' });
