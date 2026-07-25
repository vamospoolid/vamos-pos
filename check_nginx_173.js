const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 15000,
};

const conn = new Client();

console.log('Menghubungkan ke VPS 173.212.243.240 untuk cek Nginx...');

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    const cmd = `
        cat /etc/nginx/sites-available/vamos
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        
        let output = '';
        stream.on('data', d => output += d.toString());
        stream.stderr.on('data', d => console.error(d.toString()));
        
        stream.on('close', () => {
            console.log(output);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
