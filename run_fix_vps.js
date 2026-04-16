const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const readStream = fs.createReadStream('./vamos-pos-backend/fix_hours.js');
        const writeStream = sftp.createWriteStream('/var/www/vamos-pos/vamos-pos-backend/fix_hours.js');
        writeStream.on('close', () => {
            conn.exec('cd /var/www/vamos-pos/vamos-pos-backend && node fix_hours.js', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        readStream.pipe(writeStream);
    });
}).connect({
    host: '5.189.165.222',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
});
