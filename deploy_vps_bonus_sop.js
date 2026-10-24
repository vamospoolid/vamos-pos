const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000
};

const conn = new Client();
console.log(`🚀 Connecting to VPS ${VPS_CONFIG.host} to deploy Bonus Settings, Flexible SOP, and Staff App updates...`);

conn.on('ready', async () => {
    console.log('✅ SSH Connected to VPS!');

    try {
        // 1. Pack Backend Dist
        console.log('📦 1. Compressing Backend dist...');
        const backendArchive = path.join(__dirname, 'backend_dist.tar.gz');
        execSync(`tar -czf "${backendArchive}" -C "${path.join(__dirname, 'vamos-pos-backend', 'dist')}" .`);

        // 2. Pack Frontend Dist
        console.log('📦 2. Compressing POS Frontend dist...');
        const frontendArchive = path.join(__dirname, 'frontend_dist.tar.gz');
        execSync(`tar -czf "${frontendArchive}" -C "${path.join(__dirname, 'vamos-pos-frontend', 'dist')}" .`);

        // 3. Pack Staff App Dist
        console.log('📦 3. Compressing Staff App dist...');
        const staffArchive = path.join(__dirname, 'staff_dist.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        // Upload archives and backend staff source files
        console.log('📤 Uploading all archives via SFTP...');
        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                sftp.fastPut(backendArchive, '/tmp/backend_dist.tar.gz', (err) => {
                    if (err) return reject(err);
                    console.log('   - Backend archive uploaded.');

                    sftp.fastPut(frontendArchive, '/tmp/frontend_dist.tar.gz', (err) => {
                        if (err) return reject(err);
                        console.log('   - Frontend archive uploaded.');

                        sftp.fastPut(staffArchive, '/tmp/staff_dist.tar.gz', (err) => {
                            if (err) return reject(err);
                            console.log('   - Staff archive uploaded.');

                            // Upload source files
                            const localStaffService = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.service.ts');
                            const localStaffController = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.controller.ts');
                            const localStaffRoute = path.join(__dirname, 'vamos-pos-backend', 'src', 'modules', 'staff', 'staff.route.ts');

                            sftp.fastPut(localStaffService, '/tmp/staff.service.ts', (err) => {
                                if (err) return reject(err);
                                sftp.fastPut(localStaffController, '/tmp/staff.controller.ts', (err) => {
                                    if (err) return reject(err);
                                    sftp.fastPut(localStaffRoute, '/tmp/staff.route.ts', (err) => {
                                        if (err) return reject(err);
                                        console.log('   - Staff backend source files uploaded.');
                                        resolve();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        // Remote extraction and restart
        console.log('⚙️ Executing remote extraction and PM2 reload...');
        const remoteCmd = `
            echo "--- 1. Updating Backend Dist & Sources ---"
            mkdir -p /var/www/vamos/vamos-pos-backend/dist
            mkdir -p /var/www/vamos/vamos-pos-backend/data
            mkdir -p /var/www/vamos/vamos-pos-backend/src/modules/staff
            
            tar -xzf /tmp/backend_dist.tar.gz -C /var/www/vamos/vamos-pos-backend/dist
            rm -f /tmp/backend_dist.tar.gz
            
            cp /tmp/staff.service.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.service.ts
            cp /tmp/staff.controller.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.controller.ts
            cp /tmp/staff.route.ts /var/www/vamos/vamos-pos-backend/src/modules/staff/staff.route.ts
            rm -f /tmp/staff.service.ts /tmp/staff.controller.ts /tmp/staff.route.ts

            echo "--- 2. Updating POS Frontend ---"
            # Extract to temp or directly into pos-frontend
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist
            tar -xzf /tmp/frontend_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist
            rm -f /tmp/frontend_dist.tar.gz

            echo "--- 3. Updating Staff App Portal ---"
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            mkdir -p /var/www/vamos/vamos-staff-app/dist
            tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist/staff
            tar -xzf /tmp/staff_dist.tar.gz -C /var/www/vamos/vamos-staff-app/dist
            rm -f /tmp/staff_dist.tar.gz

            echo "--- 4. Restarting Backend PM2 ---"
            pm2 restart vamos-backend || pm2 restart vamos-pos-backend || pm2 restart epic-pos-backend || pm2 restart all

            echo "🎉 DEPLOYMENT FINISHED!"
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
