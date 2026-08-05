const { Client } = require('ssh2');

const conn = new Client();

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 20000,
};

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('🔄 Clearing all KDS orders on VPS...\n');
    
    const deployCmd = `
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
        
        cd /var/www/vamos/vamos-pos-backend
        
        node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            async function main() {
                try {
                    console.log('Menghapus KDS Status (Mengubah PENDING/PROCESSING menjadi SERVED)...');
                    // Ganti nama model sesuai yang ada di schema (Bisa SessionOrder, FnbOrder, atau Order)
                    // Cari model yang memiliki kdsStatus
                    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('\\$'));
                    let count = 0;
                    
                    for (const model of models) {
                        try {
                            if (prisma[model].updateMany) {
                                const result = await prisma[model].updateMany({
                                    where: { kdsStatus: { in: ['PENDING', 'PROCESSING', 'READY'] } },
                                    data: { kdsStatus: 'SERVED' }
                                });
                                if (result && result.count > 0) {
                                    console.log('Berhasil update', result.count, 'record di', model);
                                    count += result.count;
                                }
                            }
                        } catch (e) {
                            // ignore if model doesn't have kdsStatus
                        }
                    }
                    
                    console.log('Total KDS dibersihkan:', count);
                } catch(e) {
                    console.error('Error:', e);
                } finally {
                    await prisma.\\$disconnect();
                }
            }
            main();
        "
    `;

    conn.exec(deployCmd, (err, stream) => {
        if (err) throw err;
        
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        
        stream.on('close', (code) => {
            console.log(`\n🔌 SSH Connection closed with code: ${code}`);
            conn.end();
        });
    });
}).on('error', err => {
    console.error('❌ SSH Error:', err.message);
}).connect(VPS_CONFIG);
