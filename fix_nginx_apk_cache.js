const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Read current nginx config
    conn.exec('cat /etc/nginx/sites-available/vamos', (err, stream) => {
        if (err) throw err;
        let config = '';
        stream.on('data', d => config += d.toString());
        stream.on('close', () => {
            // Add APK-specific location block in the player app server block
            const oldBlock = `    server_name app.vamospool.id;
    root /var/www/vamos-pos/vamos-player-app/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
    }`;

            const newBlock = `    server_name app.vamospool.id;
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
    }`;

            const newConfig = config.replace(oldBlock, newBlock);
            
            // Write new config
            const writeCmd = `cat > /etc/nginx/sites-available/vamos << 'NGINX_EOF'\n${newConfig}\nNGINX_EOF`;
            
            conn.exec(`printf '%s' '${newConfig.replace(/'/g, "'\\''")}' > /etc/nginx/sites-available/vamos && nginx -t && nginx -s reload && echo "Nginx updated and reloaded OK!"`, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                stream2.on('close', () => { conn.end(); });
            });
        });
    });
}).connect({ host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' });
