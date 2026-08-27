const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    const cmd = `
        pm2 list
        echo "=== PM2 DESCRIBE VAMOS-BACKEND ==="
        pm2 describe vamos-backend || true
        echo "=== PM2 DESCRIBE POSCAFE-BACKEND ==="
        pm2 describe poscafe-backend || true
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect(VPS_CONFIG);
