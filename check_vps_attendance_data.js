const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            async function main() {
                const attendances = await prisma.attendance.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { employee: true, shift: true }
                });
                console.log(JSON.stringify(attendances, null, 2));
            }
            main().catch(console.error).finally(() => prisma.\\$disconnect());
        "
    `, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            console.log('VPS Attendance Data:\n', output);
            conn.end();
        });
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
