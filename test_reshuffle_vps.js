const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
};

const conn = new Client();

conn.on('ready', () => {
    const cmd = `
        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const { prisma } = require('./dist/database/db');
            const { TournamentService } = require('./dist/modules/tournaments/tournament.service');
            async function testReshuffle() {
                const t = await prisma.tournament.findFirst({
                    where: { status: { not: 'COMPLETED' } },
                    orderBy: { createdAt: 'desc' }
                });
                if (!t) return console.log('No active tournament found');
                console.log('Reshuffling tournament:', t.name, 'ID:', t.id);
                const res = await TournamentService.reshuffleBracket(t.id);
                console.log('--- NEW MATCHES (SEMIFINAL CONVERGENCE) ---');
                res.matches.filter(m => m.round === 1).forEach(m => {
                    const p1 = m.player1 ? (m.player1.name || m.player1.member?.name) : 'TBD';
                    const p2 = m.player2 ? (m.player2.name || m.player2.member?.name) : 'TBD';
                    const q = m.matchNumber <= 4 ? 'POOL A - Q1' : m.matchNumber <= 8 ? 'POOL A - Q2' : m.matchNumber <= 12 ? 'POOL B - Q3' : 'POOL B - Q4';
                    console.log('Match #' + String(m.matchNumber).padStart(2, '0') + ' (' + q + '): ' + p1.padEnd(20) + ' vs ' + p2);
                });
            }
            testReshuffle().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
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
