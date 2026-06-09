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
        echo "🔫 Killing processes on port 3000..."
        fuser -k 3000/tcp || true
        sleep 2
        echo "🔄 Restarting PM2..."
        pm2 restart all
        echo "✅ Done!"
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
