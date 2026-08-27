const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const { prisma } = require('./dist/database/db');
            async function inspect() {
                const t = await prisma.tournament.findFirst({
                    where: { status: { not: 'COMPLETED' } },
                    include: {
                        matches: {
                            include: { player1: true, player2: true, winner: true },
                            orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
                        }
                    }
                });
                if (!t) return console.log('No active tournament');
                console.log('Tournament:', t.name, 'ID:', t.id);
                t.matches.forEach(m => {
                    const p1 = m.player1 ? m.player1.name : 'TBD';
                    const p2 = m.player2 ? m.player2.name : 'TBD';
                    const win = m.winner ? m.winner.name : '-';
                    if (p1.includes('IDRUS') || p2.includes('IDRUS') || p1.includes('FARIZ') || p2.includes('FARIZ')) {
                        console.log('R' + m.round + ' M#' + m.matchNumber + ' (ID: ' + m.id + '): ' + p1 + ' (' + m.score1 + ') vs ' + p2 + ' (' + m.score2 + ') -> Winner: ' + win + ' Status: ' + m.status);
                    }
                });
            }
            inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
        "
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
