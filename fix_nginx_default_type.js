const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    const cmd = `
        echo "=== 1. MODIFY CONFIG FOR SINGLE CONTENT-TYPE ==="
        python3 << 'PYEOF'
config_path = '/etc/nginx/sites-available/vamos'
with open(config_path, 'r') as f:
    content = f.read()

# Ganti add_header Content-Type dengan default_type agar Nginx tidak mengirimkan dual Content-Type
old_str = 'add_header Content-Type "application/vnd.android.package-archive";'
new_str = 'default_type application/vnd.android.package-archive;'

if old_str in content:
    content = content.replace(old_str, new_str)
    with open(config_path, 'w') as f:
        f.write(content)
    print("✅ Configuration updated successfully (replaced add_header with default_type)!")
else:
    print("⚠️ Pattern not found or already replaced!")
PYEOF

        echo "\\n=== 2. VERIFY NGINX CONFIG & RESTART ==="
        nginx -t
        if [ $? -eq 0 ]; then
            echo "-> Restarting Nginx..."
            systemctl restart nginx && echo "✅ Nginx restarted successfully!"
        else
            echo "❌ Nginx configuration test failed!"
        fi

        echo "\\n=== 3. TEST HTTP HEADER OF APK ==="
        curl -s -I https://app.vamospool.id/VamosPlayer.apk
        echo ""
        curl -s -I https://pos.vamospool.id/VamosPlayer.apk
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n🔌 Done!');
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
