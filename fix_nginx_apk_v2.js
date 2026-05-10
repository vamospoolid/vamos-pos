const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
# Backup existing config first
cp /etc/nginx/sites-available/vamos /etc/nginx/sites-available/vamos.bak

# Use Python to modify the nginx config cleanly
python3 << 'PYEOF'
with open('/etc/nginx/sites-available/vamos', 'r') as f:
    content = f.read()

old_player = """    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
    }"""

new_player = """    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
    location ~* \\.apk$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Content-Type "application/vnd.android.package-archive";
        add_header Content-Disposition "attachment";
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
    }"""

if old_player in content:
    new_content = content.replace(old_player, new_player, 1)
    with open('/etc/nginx/sites-available/vamos', 'w') as f:
        f.write(new_content)
    print("SUCCESS: Nginx config updated with APK no-cache headers!")
else:
    print("WARNING: Pattern not found - config may already be modified or format different")
    print("Current app.vamospool.id block:")
    start = content.find('app.vamospool.id')
    print(content[max(0,start-20):start+400])
PYEOF

echo "=== Testing Nginx config ==="
nginx -t

echo "=== Reloading Nginx ==="
nginx -s reload && echo "Nginx reloaded OK!"
`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
