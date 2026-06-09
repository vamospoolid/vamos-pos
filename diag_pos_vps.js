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
    // Check all API URLs embedded in built frontend
    const cmd = `
        echo "=== Checking API URL in POS frontend dist ==="
        grep -rho '"https://[^"]*api[^"]*"' /var/www/vamos-pos/vamos-pos-frontend/dist/assets/ | head -5
        echo "=== Checking Nginx status ==="
        systemctl status nginx --no-pager -l | tail -10
        echo "=== Test api.vamospool.id from VPS ==="
        curl -sk https://api.vamospool.id/api/license/status | head -c 200
        echo ""
        echo "=== Check pos.vamospool.id Nginx config ==="
        cat /etc/nginx/sites-enabled/vamos | grep -A 10 'pos.vamospool.id'
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
