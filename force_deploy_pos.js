const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const conn = new Client();

const config = {
    host: '144.91.73.36',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

// Verify the local dist has correct API URL
const distPath = path.join(__dirname, 'vamos-pos-frontend', 'dist', 'assets');
const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));

console.log('🔍 Checking local dist for API URL...');
let found = false;
for (const f of files) {
    const content = fs.readFileSync(path.join(distPath, f), 'utf8');
    if (content.includes('api.vamospool.id')) {
        console.log(`✅ Found api.vamospool.id in: ${f}`);
        found = true;
    }
    if (content.includes('localhost:3000')) {
        console.log(`❌ Found localhost:3000 in: ${f}`);
    }
}
if (!found) {
    console.log('⚠️ api.vamospool.id not found in local dist! Rebuilding...');
    execSync('npm run build', { cwd: path.join(__dirname, 'vamos-pos-frontend'), stdio: 'inherit' });
    console.log('✅ Rebuild complete!');
}

console.log('\n📤 Deploying to VPS...');

const localDist = path.join(__dirname, 'vamos-pos-frontend', 'dist');
const remoteDist = '/var/www/vamos-pos/vamos-pos-frontend/dist';
const archiveName = 'pos_frontend_dist.tar.gz';
const localArchive = path.join(__dirname, archiveName);
const remoteArchive = `/tmp/${archiveName}`;

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    (async () => {
        try {
            execSync(`tar -czf "${localArchive}" -C "${localDist}" .`);
            console.log('📦 Archive created');

            await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    sftp.fastPut(localArchive, remoteArchive, (err) => {
                        if (err) return reject(err);
                        console.log('⬆️  Uploaded to VPS');
                        resolve();
                    });
                });
            });

            await new Promise((resolve, reject) => {
                const cmd = `
                    rm -rf ${remoteDist}/*
                    tar -xzf ${remoteArchive} -C ${remoteDist}
                    rm ${remoteArchive}
                `;
                conn.exec(cmd, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('data', d => {});
                    stream.on('close', () => resolve());
                });
            });

            if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);
            console.log('✅ Deployed! Restarting Nginx...');

            conn.exec('systemctl restart nginx', (err, stream) => {
                stream.on('close', () => {
                    console.log('✅ Nginx restarted. Done!');
                    conn.end();
                });
            });
        } catch (err) {
            console.error('❌ Error:', err);
            conn.end();
        }
    })();
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
