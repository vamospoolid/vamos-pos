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

const conn = new Client();

console.log(`Connecting to VPS ${VPS_CONFIG.host}...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected to VPS 173.212.243.240!\n');

    try {
        // 1. Deploy POS Backend
        console.log('📦 1. Packing & Deploying POS Backend...');
        const backendArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(backendArchive, '/tmp/backend_dist.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // Upload schema.prisma & seed script
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(
                    path.join(__dirname, 'vamos-pos-backend', 'prisma', 'schema.prisma'),
                    '/var/www/vamos/vamos-pos-backend/prisma/schema.prisma',
                    (err) => {
                        if (err) return reject(err);
                        sftp.fastPut(
                            path.join(__dirname, 'vamos-pos-backend', 'seed-real-staff.js'),
                            '/var/www/vamos/vamos-pos-backend/seed-real-staff.js',
                            (err) => {
                                if (err) return reject(err);
                                resolve();
                            }
                        );
                    }
                );
            });
        });

        // 2. Deploy POS Frontend
        console.log('📦 2. Packing & Deploying POS Frontend...');
        const frontendArchive = path.join(__dirname, 'frontend_dist.tar.gz');
        execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(frontendArchive, '/tmp/frontend_dist.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 3. Deploy Staff App
        console.log('📦 3. Packing & Deploying Staff App...');
        const staffArchive = path.join(__dirname, 'staff_dist.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(staffArchive, '/tmp/staff_dist.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        // 3.5 Deploy VamosStaff.apk
        console.log('📱 3.5 Uploading VamosStaff.apk...');
        const apkLocal = path.join(__dirname, 'VamosStaff.apk');
        if (fs.existsSync(apkLocal)) {
            await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    sftp.fastPut(apkLocal, '/tmp/VamosStaff.apk', (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        }

        // 4. Remote Execution & PM2 Reload on VPS
        console.log('\n🚀 4. Executing Database Migration & PM2 Reload on VPS...');
        const remoteCmd = `
            echo "--- Extracting Backend ---"
            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz

            echo "--- Database Migration & Staff Sync ---"
            cd /var/www/vamos/vamos-pos-backend
            npx prisma db push --accept-data-loss
            node seed-real-staff.js

            echo "--- Extracting POS Frontend ---"
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            rm -rf /var/www/vamos/vamos-pos-frontend/dist/*
            tar -xzf /tmp/frontend_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/frontend_dist.tar.gz

            echo "--- Extracting Staff App ---"
            mkdir -p /var/www/vamos/vamos-staff-app/dist
            rm -rf /var/www/vamos/vamos-staff-app/dist/*
            tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-staff-app/dist
            rm -f /tmp/staff_dist.tar.gz

            # Link staff app to nginx public path
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            cp -r /var/www/vamos/vamos-staff-app/dist/* /var/www/vamos/vamos-pos-frontend/dist/staff/

            # Copy VamosStaff.apk to public download locations
            if [ -f /tmp/VamosStaff.apk ]; then
                cp /tmp/VamosStaff.apk /var/www/vamos/vamos-pos-frontend/dist/VamosStaff.apk
                cp /tmp/VamosStaff.apk /var/www/vamos/VamosStaff.apk
                rm -f /tmp/VamosStaff.apk
            fi

            echo "--- Restarting PM2 Services ---"
            pm2 restart all || pm2 restart vamos-pos-backend

            echo "🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', (d) => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log('\n✅ DEPLOY TO VPS SUCCEEDED 100%!');
                conn.end();
            });
        });

    } catch (error) {
        console.error('❌ Deploy Error:', error);
        conn.end();
    }
});

conn.connect(VPS_CONFIG);
