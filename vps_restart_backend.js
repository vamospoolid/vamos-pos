const { Client } = require('ssh2'); 
const conn = new Client(); 

conn.on('ready', () => { 
    // Kill existing process and start new one in background
    const cmd = `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        
        echo "Clearing log file..."
        > backend_log.txt
        
        echo "Clearing port 3000..."
        fuser -k 3000/tcp || echo "Port was already clear"
        sleep 2
        
        echo "Killing old backend processes..."
        pkill -f "node dist/server.js" || echo "No process found"
        sleep 1
        
        echo "Starting new backend process..."
        cd /var/www/vamos-pos/vamos-pos-backend
        nohup node dist/server.js >> backend_log.txt 2>&1 &
        sleep 2
        
        echo "Verifying process..."
        ps aux | grep "node dist/server.js" | grep -v grep
        
        echo "Backend restart command executed."
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
