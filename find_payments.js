const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected');
    const cmd = `cd /var/www/vamos/vamos-pos-backend && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const payments = await prisma.payment.findMany({
        where: {
            sessionId: null,
            createdAt: { gte: today }
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log('--- FOUND PAYMENTS WITHOUT SESSION TODAY ---');
    console.log(JSON.stringify(payments, null, 2));
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
