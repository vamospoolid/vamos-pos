const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/vamos/vamos-pos-backend && node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient(); p.table.findMany({ where: { deletedAt: null }, orderBy: { relayChannel: \'asc\' } }).then(t => { console.log(JSON.stringify(t.map(x => ({ id: x.id, name: x.name, relayChannel: x.relayChannel })), null, 2)); p.\\$disconnect(); });"', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
