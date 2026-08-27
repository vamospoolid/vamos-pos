const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected');
    const cmd = `cd /var/www/vamos/vamos-pos-backend && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const deleted = await prisma.payment.deleteMany({
        where: {
            id: { in: ['cc0192b2-d995-4212-9f50-9dc7296e3274', 'ddaed34c-e7b6-4edc-9911-61c293c52636'] }
        }
    });
    console.log('✅ Deleted orphan payments from reports:', deleted.count);
}
run().finally(() => prisma.\\$disconnect());
"`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
