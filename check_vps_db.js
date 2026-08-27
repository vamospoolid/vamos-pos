const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
};

const conn = new Client();

conn.on('ready', () => {
    // Run a node script inside the backend directory on VPS to print latest tournament participants and matches
    const cmd = `
        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const { prisma } = require('./dist/database/db');
            async function check() {
                const t = await prisma.tournament.findFirst({
                    orderBy: { createdAt: 'desc' },
                    include: {
                        participants: { include: { member: true } },
                        matches: {
                            include: {
                                player1: { include: { member: true } },
                                player2: { include: { member: true } }
                            },
                            orderBy: { matchNumber: 'asc' }
                        }
                    }
                });
                if (!t) return console.log('No tournament found');
                console.log('Tournament:', t.name, 'ID:', t.id);
                console.log('--- PARTICIPANTS ---');
                t.participants.forEach((p, i) => {
                    console.log((i+1) + '. ID=' + p.id + ' MemberID=' + p.memberId + ' Name=' + p.name + ' MemberName=' + (p.member?.name));
                });
                console.log('--- MATCHES ---');
                t.matches.filter(m => m.round === 1).forEach(m => {
                    const p1 = m.player1 ? (m.player1.name || m.player1.member?.name) : 'TBD';
                    const p2 = m.player2 ? (m.player2.name || m.player2.member?.name) : 'TBD';
                    console.log('Match #' + m.matchNumber + ': ' + p1 + ' vs ' + p2);
                });
            }
            check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
        "
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect(VPS_CONFIG);
