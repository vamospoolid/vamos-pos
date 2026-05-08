const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('🔍 Membuka Firewall & Cek Nginx...');
    // Membuka port 80, 443 dan merestart nginx
    const cmd = 'sudo ufw allow 80/tcp; sudo ufw allow 443/tcp; sudo ufw allow "Nginx Full"; sudo systemctl restart nginx; sudo systemctl status nginx';
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n✅ Firewall OK & Nginx Restarted!');
            conn.end();
        });
    });
}).connect({ 
    host: '144.91.73.36', 
    port: 22, 
    username: 'root', 
    password: 'Ahmaddcc07' 
});
