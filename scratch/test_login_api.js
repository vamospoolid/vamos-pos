const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS');

    const cmd = `
        echo "=== DAFTAR USER DI vamos_pos ==="
        PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos -c "SELECT id, email, name, role FROM \\"User\\";"

        cd /var/www/vamos/vamos-pos-backend
        node -e "
            const bcrypt = require('bcrypt');
            const { execSync } = require('child_process');
            (async () => {
                const hash = await bcrypt.hash('admin123', 10);
                const hashOwner = await bcrypt.hash('owner123', 10);
                const hashKasir = await bcrypt.hash('kasir123', 10);

                const sql = \\\`
                    INSERT INTO \\\\\\"User\\\\\\" (id, email, name, password, role, \\\\\\"createdAt\\\\\\", \\\\\\"updatedAt\\\\\\")
                    VALUES (gen_random_uuid(), 'admin@vamos.pos', 'Admin', '\${hash}', 'ADMIN', NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET password = '\${hash}';

                    INSERT INTO \\\\\\"User\\\\\\" (id, email, name, password, role, \\\\\\"createdAt\\\\\\", \\\\\\"updatedAt\\\\\\")
                    VALUES (gen_random_uuid(), 'owner@vamos.pos', 'Owner', '\${hashOwner}', 'OWNER', NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET password = '\${hashOwner}';

                    INSERT INTO \\\\\\"User\\\\\\" (id, email, name, password, role, \\\\\\"createdAt\\\\\\", \\\\\\"updatedAt\\\\\\")
                    VALUES (gen_random_uuid(), 'kasir@vamos.pos', 'Kasir Utama', '\${hashKasir}', 'KASIR', NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET password = '\${hashKasir}';
                \\\`;
                execSync(\\\`PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos -c \\\\\\"\${sql}\\\\\\\"\\\`);
                console.log('✅ Successfully updated users in vamos_pos database!');
            })();
        "

        echo "=== Testing Login Endpoint on Port 4005 ==="
        curl -s -k -X POST http://127.0.0.1:4005/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@vamos.pos","password":"admin123"}'
        echo ""

        echo "=== Testing Public Domain https://api.vamospool.id/api/auth/login ==="
        curl -s -k -X POST https://api.vamospool.id/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@vamos.pos","password":"admin123"}'
        echo ""
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' });

