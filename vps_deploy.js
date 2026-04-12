const { Client } = require('ssh2'); 
const conn = new Client(); 

conn.on('ready', () => { 
    const cmd = `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        
        cd /var/www/vamos-pos
        
        echo "=== DB PUSH ==="
        cd vamos-pos-backend
        npx prisma db push
        
        echo "=== REBUILDING BACKEND ==="
        npm run build
        
        echo "=== REBUILDING PLAYER APP ==="
        cd ../vamos-player-app
        npm run build
        
        echo "=== REBUILDING POS FRONTEND ==="
        cd ../vamos-pos-frontend
        npm run build
        
        echo "=== RESTARTING SERVICES ==="
        fuser -k 3000/tcp || echo "Port 3000 clear"
        cd ../vamos-pos-backend
        nohup node dist/server.js > backend_log.txt 2>&1 &
        
        nginx -s reload
        
        echo "=== ALL DONE ==="
    `;
    
    conn.exec(cmd, (err, stream) => { 
        if (err) throw err; 
        stream.on('data', d => process.stdout.write(d.toString())); 
        stream.stderr.on('data', d => process.stderr.write(d.toString())); 
        stream.on('close', () => { 
            console.log("\nDone!"); 
            conn.end(); 
        }); 
    }); 
}).connect({ 
    host: '5.189.165.222', 
    port: 22, 
    username: 'root', 
    password: 'Ahmaddcc07' 
});
