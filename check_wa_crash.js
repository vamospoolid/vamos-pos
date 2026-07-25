const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

conn.on('ready', () => {
    console.log('Mengecek log error whatsapp di VPS...\n');
    conn.exec('grep -E "WHATSAPP|Error|Exception" /root/.pm2/logs/vamosdemo-backend-out.log /root/.pm2/logs/vamosdemo-backend-error.log | tail -n 30', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n--- Production Logs ---\n');
            conn.exec('grep -E "WHATSAPP|Error|Exception|Terputus" /root/.pm2/logs/vamos-backend-out.log /root/.pm2/logs/vamos-backend-error.log | tail -n 30', (err2, stream2) => {
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.on('close', () => conn.end());
            });
        });
    });
}).connect(config);
