const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mengecek status Backend Demo...\n');
    
    // Mengecek isi file .env
    conn.exec('cat /var/www/vamosdemo/vamos-pos-backend/.env | grep PORT', (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => {
            console.log('--- .env PORT ---');
            console.log(data.toString());
        });
        
        stream.on('close', () => {
            // Mengecek error log dari PM2
            conn.exec('pm2 logs vamosdemo-backend --lines 15 --nostream', (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('data', (data) => {
                    console.log('--- PM2 LOGS ---');
                    console.log(data.toString());
                });
                stream2.on('close', () => {
                    conn.end();
                });
            });
        });
    });
}).connect(config);
