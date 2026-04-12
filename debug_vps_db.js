const { Client } = require('ssh2'); 
const conn = new Client(); 

conn.on('ready', () => { 
    const cmd = `
        cd /var/www/vamos-pos/vamos-pos-backend
        node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.tournament.findMany({take: 1, orderBy: {createdAt: 'desc'}}).then(t => { console.log(JSON.stringify(t, null, 2)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"
    `;
    
    conn.exec(cmd, (err, stream) => { 
        if (err) throw err; 
        stream.on('data', d => process.stdout.write(d.toString())); 
        stream.stderr.on('data', d => process.stderr.write(d.toString())); 
        stream.on('close', () => conn.end()); 
    }); 
}).connect({ 
    host: '5.189.165.222', 
    port: 22, 
    username: 'root', 
    password: 'Ahmaddcc07' 
});
