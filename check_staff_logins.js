const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        cd /var/www/vamos/vamos-pos-backend
        node -e '
            const { PrismaClient } = require("@prisma/client");
            const p = new PrismaClient();
            async function main() {
                const emps = await p.employee.findMany({
                    where: { deletedAt: null },
                    select: { id: true, name: true, phone: true, pinCode: true, position: true, status: true }
                });
                console.log(JSON.stringify(emps, null, 2));
            }
            main().catch(console.error).finally(() => p.$disconnect());
        '
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
