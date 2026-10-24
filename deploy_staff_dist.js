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
    console.log('✅ SSH Connected!');
    try {
        const staffArchive = path.join(__dirname, 'staff_dist_rel.tar.gz');
        execSync(`tar -czf "${staffArchive}" -C "${path.join(__dirname, 'vamos-staff-app', 'dist')}" .`);

        await new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(staffArchive, '/tmp/staff_dist_rel.tar.gz', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        const remoteCmd = `
            mkdir -p /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -rf /var/www/vamos/vamos-pos-frontend/dist/staff/*
            tar -xzf /tmp/staff_dist_rel.tar.gz -C /var/www/vamos/vamos-pos-frontend/dist/staff
            rm -f /tmp/staff_dist_rel.tar.gz
            echo "🎉 Staff Portal at https://pos.vamospool.id/staff/ updated with relative assets!"
        `;

        conn.exec(remoteCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log('✅ Staff Portal deployed successfully!');
                conn.end();
            });
        });
    } catch (e) {
        console.error('Error:', e);
        conn.end();
    }
}).connect(VPS_CONFIG);
