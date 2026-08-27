const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const PROJECTS = [
    {
        name: 'POS Backend',
        localDist: path.join(__dirname, 'vamos-pos-backend', 'dist'),
        remoteDist: '/var/www/vamos/vamos-pos-backend/dist'
    },
    {
        name: 'POS Frontend',
        localDist: path.join(__dirname, 'vamos-pos-frontend', 'dist'),
        remoteDist: '/var/www/vamos/vamos-pos-frontend/dist'
    },
    {
        name: 'Player App',
        localDist: path.join(__dirname, 'vamos-player-app', 'dist'),
        remoteDist: '/var/www/vamos/vamos-player-app/dist'
    }
];

const conn = new Client();

console.log(`Connecting to VPS ${VPS_CONFIG.host}...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected to VPS 173.212.243.240!\n');

    try {
        for (const proj of PROJECTS) {
            console.log(`📦 Packing & Deploying ${proj.name}...`);
            const archiveName = `${proj.name.toLowerCase().replace(/\s+/g, '_')}_dist.tar.gz`;
            const localArchive = path.join(__dirname, archiveName);
            const remoteArchive = `/tmp/${archiveName}`;

            console.log(`   - Compressing local ${proj.localDist}...`);
            execSync(`tar -czf "${localArchive}" -C "${proj.localDist}" .`);

            console.log(`   - Uploading to VPS ${remoteArchive}...`);
            await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    sftp.fastPut(localArchive, remoteArchive, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });

            console.log(`   - Extracting to ${proj.remoteDist}...`);
            await new Promise((resolve, reject) => {
                const cmd = `
                    # Backup APK if exists in POS Frontend
                    if [ "${proj.remoteDist}" = "/var/www/vamos/vamos-pos-frontend/dist" ]; then
                        cp /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk /tmp/VamosPlayer.apk 2>/dev/null || true
                    fi

                    mkdir -p ${proj.remoteDist}
                    rm -rf ${proj.remoteDist}/*
                    tar -xzf ${remoteArchive} -C ${proj.remoteDist}
                    rm -f ${remoteArchive}

                    if [ "${proj.remoteDist}" = "/var/www/vamos/vamos-pos-frontend/dist" ]; then
                        cp /tmp/VamosPlayer.apk /var/www/vamos/vamos-pos-frontend/dist/VamosPlayer.apk 2>/dev/null || true
                    fi
                `;
                conn.exec(cmd, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => resolve());
                });
            });

            try { fs.unlinkSync(localArchive); } catch(e){}
            console.log(`   ✅ ${proj.name} deployed successfully!\n`);
        }

        console.log('🔄 Restarting PM2 Backend & Reloading Nginx...');
        await new Promise((resolve, reject) => {
            const restartCmd = `
                source ~/.bashrc 2>/dev/null || true
                source ~/.nvm/nvm.sh 2>/dev/null || true
                export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
                pm2 restart vamos-backend --update-env || pm2 restart all || true
                systemctl reload nginx || systemctl restart nginx || true
            `;
            conn.exec(restartCmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => resolve());
            });
        });

        console.log('\n🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!');
        console.log('🌐 Backend API: https://api.vamospool.id');
        console.log('🌐 POS: https://pos.vamospool.id');
        console.log('📱 Player App: https://app.vamospool.id');
        conn.end();
    } catch (err) {
        console.error('❌ Deployment Error:', err);
        conn.end();
    }
}).on('error', (err) => {
    console.error('❌ SSH Connection Error:', err.message);
}).connect(VPS_CONFIG);
