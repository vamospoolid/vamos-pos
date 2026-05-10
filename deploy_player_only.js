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

const project = {
    name: 'Player App',
    localDist: path.join(__dirname, 'vamos-player-app', 'dist'),
    remoteDist: '/var/www/vamos-pos/vamos-player-app/dist'
};

conn.on('ready', () => {
    console.log('✅ SSH Connected untuk Deploy Player App!\n');

    async function deployProject() {
        console.log(`📦 Deploying ${project.name}...`);
        
        const archiveName = `${project.name.toLowerCase().replace(' ', '_')}_dist.tar.gz`;
        const localArchive = path.join(__dirname, archiveName);
        const remoteArchive = `/tmp/${archiveName}`;

        // 1. Compress local dist
        console.log(`   - Compressing local dist...`);
        execSync(`tar -czf "${localArchive}" -C "${project.localDist}" .`);

        // 2. Upload to VPS
        console.log(`   - Uploading to VPS...`);
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(localArchive, remoteArchive, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 3. Extract on VPS
        console.log(`   - Extracting on VPS...`);
        await new Promise((resolve, reject) => {
            const cmd = `
                sudo mkdir -p ${project.remoteDist}
                sudo rm -rf ${project.remoteDist}/*
                sudo tar -xzf ${remoteArchive} -C ${project.remoteDist}
                sudo rm ${remoteArchive}
            `;
            conn.exec(cmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('data', d => {}); 
                stream.stderr.on('data', d => {});
                stream.on('close', () => resolve());
            });
        });

        // 4. Cleanup local
        if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);
        console.log(`   ✅ ${project.name} deployed!\n`);
    }

    (async () => {
        try {
            await deployProject();
            console.log('🚀 Player App deployed! Merestart Nginx...');
            conn.exec('sudo systemctl restart nginx', (err, stream) => {
                stream.on('data', d => {});
                stream.on('close', () => {
                    console.log('✅ Nginx restarted.');
                    conn.end();
                });
            });
        } catch (err) {
            console.error('❌ Error selama deploy:', err);
            conn.end();
        }
    })();
}).connect(config);
