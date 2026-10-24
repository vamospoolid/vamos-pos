const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000,
};

const conn = new Client();
console.log(`🚀 Connecting to VPS ${VPS_CONFIG.host} to deploy Staff App & Backend updates...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');

    try {
        // 1. Build Staff App Archive
        console.log('📦 Archiving local Staff App dist...');
        const staffArchive = path.join(__dirname, 'staff_dist_rel.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        // 2. Upload Backend staff module files and Staff Archive via SFTP
        const localStaffService = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.service.ts');
        const localStaffController = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.controller.ts');
        const localStaffRoute = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.route.ts');
        const localQrService = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'qr', 'qr.service.ts');

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                console.log('📤 Uploading backend staff & qr files to /tmp...');
                sftp.fastPut(localStaffService, '/tmp/staff.service.ts', (err) => {
                    if (err) return reject(err);
                    sftp.fastPut(localStaffController, '/tmp/staff.controller.ts', (err) => {
                        if (err) return reject(err);
                        sftp.fastPut(localStaffRoute, '/tmp/staff.route.ts', (err) => {
                            if (err) return reject(err);
                            sftp.fastPut(localQrService, '/tmp/qr.service.ts', (err) => {
                                if (err) return reject(err);
                                console.log('✅ Backend staff & qr files uploaded to /tmp!');

                                console.log('📤 Uploading Staff App archive...');
                                sftp.fastPut(staffArchive, '/tmp/staff_dist_rel.tar.gz', (err) => {
                                    if (err) return reject(err);
                                    console.log('✅ Staff App archive uploaded!');
                                    resolve();
                                });
                            });
                        });
                    });
                });
            });
        });

        // 3. Extract Staff App, Move backend files, Rebuild Backend & Restart PM2
        console.log('🔄 Executing remote deploy and restart...');
        const remoteCmd = `
            source ~/.bashrc 2>/dev/null || true
            source ~/.nvm/nvm.sh 2>/dev/null || true
            export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

            # 1. Update Staff Web Portal
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -rf /var/www/vamos/vamos-pos-frontend/dist/staff/*
            tar -xzf /tmp/staff_dist_rel.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -f /tmp/staff_dist_rel.tar.gz
            echo "✅ Staff Portal deployed at /staff/"

            # 2. Update Backend staff & qr files & Rebuild
            mkdir -p /var/www/vamos/vamos-pos-backend/src/modules/staff
            mkdir -p /var/www/vamos/vamos-pos-backend/src/modules/qr
            cp /tmp/staff.service.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.service.ts
            cp /tmp/staff.controller.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.controller.ts
            cp /tmp/staff.route.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.route.ts
            cp /tmp/qr.service.ts /var/www/vamos/vamos-pos-backend/src/modules/qr/qr.service.ts
            rm -f /tmp/staff.service.ts /tmp/staff.controller.ts /tmp/staff.route.ts /tmp/qr.service.ts

            cd /var/www/vamos/vamos-pos-backend
            echo "🔨 Rebuilding backend..."
            npm run build
            
            echo "🔄 Restarting backend services..."
            pm2 restart vamos-backend || pm2 restart epic-pos-backend || pm2 restart all
            
            echo "🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log(`\n✅ Remote deploy finished with code: ${code}`);
                conn.end();
            });
        });

    } catch (e) {
        console.error('❌ Deployment error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
