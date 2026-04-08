const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('SSH connection established. Hunting for repository...');

    conn.exec('find /var/www /root /home -maxdepth 3 -type d -name "vamos-pos-backend" 2>/dev/null', (err, stream) => {
        if (err) throw err;
        let paths = '';
        stream.on('data', (data) => paths += data);
        stream.on('close', () => {
            const lines = paths.trim().split('\n').filter(l => l);
            if (lines.length === 0) {
                console.log('Repository not found!');
                return conn.end();
            }
            
            const backendPath = lines[0].trim();
            const projectRoot = backendPath.replace('/vamos-pos-backend', '');
            console.log('Project root found at:', projectRoot);

            const deployScript = `
                source ~/.bashrc 2>/dev/null
                source ~/.nvm/nvm.sh 2>/dev/null
                export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
                
                cd ${projectRoot}
                echo "1. Cleaning dirty git state..."
                git fetch origin main
                git checkout . 
                git clean -fd
                
                echo "2. Pulling latest code..."
                git pull origin main
                
                echo "3. Restarting backend PM2..."
                cd vamos-pos-backend
                # Ensure the APK was copied into public
                npm run build
                pm2 restart all || echo "PM2 restart failed, checking npx" || npx pm2 restart all
                
                echo "DONE!"
            `;

            conn.exec(deployScript, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('data', (d) => process.stdout.write(d.toString()));
                stream2.stderr.on('data', (d) => process.stderr.write(d.toString()));
                stream2.on('close', () => {
                    console.log('Deployment sequence finished.');
                    conn.end();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '5.189.165.222',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
});
