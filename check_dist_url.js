const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    const cmd = `
        echo "🔍 Checking API URL in built JS files..."
        grep -r "https://api.vamospool.id/api" /var/www/vamos-pos/vamos-pos-frontend/dist/assets/ || echo "❌ Not found!"
        echo "🔍 Checking localhost in built JS files..."
        grep -r "http://localhost:3000/api" /var/www/vamos-pos/vamos-pos-frontend/dist/assets/ || echo "❌ Not found!"
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
