const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const { prisma } = require('./dist/database/db');
            async function fixMatch() {
                const matchId = '52be9c9b-4611-4fb3-b5d5-92e42c8adeac';
                const m = await prisma.tournamentMatch.findUnique({
                    where: { id: matchId },
                    include: { player1: true, player2: true }
                });
                if (!m) return console.log('Match not found');
                console.log('Original Match:', m.player1?.name, 'vs', m.player2?.name);
                const idrusId = m.player1Id;
                const farizId = m.player2Id;

                // 1. Update R1 M#6: score1 = 5, score2 = 1, winnerId = idrusId
                await prisma.tournamentMatch.update({
                    where: { id: matchId },
                    data: {
                        score1: 5,
                        score2: 1,
                        winnerId: idrusId,
                        status: 'COMPLETED'
                    }
                });
                console.log('✅ Updated R1 M#6: IDRUS AND (5) vs FARIZ VAMOS (1) -> Winner: IDRUS AND');

                // 2. Update R2 M#19: replace FARIZ VAMOS with IDRUS AND
                const r2Match = await prisma.tournamentMatch.findUnique({
                    where: { id: 'c4b891ec-9a6b-4d5b-8a5f-3dc29719d4d0' }
                });
                if (r2Match) {
                    const updateData = {};
                    if (r2Match.player1Id === farizId) updateData.player1Id = idrusId;
                    if (r2Match.player2Id === farizId) updateData.player2Id = idrusId;
                    await prisma.tournamentMatch.update({
                        where: { id: r2Match.id },
                        data: updateData
                    });
                    console.log('✅ Updated R2 M#19: replaced FARIZ VAMOS with IDRUS AND');
                }
            }
            fixMatch().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
        "
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });
