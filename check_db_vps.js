const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
        cd /var/www/vamos/vamos-pos-backend
        cat << 'EOF' > test_db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tpl = await prisma.waTemplate.findUnique({ where: { id: 'wa_booking_confirm' } });
  console.log(JSON.stringify(tpl, null, 2));
  await prisma.$disconnect();
}
run();
EOF
        node test_db.js
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
