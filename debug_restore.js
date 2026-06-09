const { Client } = require('ssh2');
const fs = require('fs');

const VPS_LAMA = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };
const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const LOCAL_DUMP = 'vamos_migrasi.sql';

console.log('🔄 [Tahap 1] Menyedot data dari VPS Lama...');

const connLama = new Client();
connLama.on('ready', () => {
    const dumpCmd = 'export PGPASSWORD="vamos_password123" && pg_dump -U vamos_user -h localhost -p 5432 -d vamos_db --clean --if-exists -O';
    
    connLama.exec(dumpCmd, (err, stream) => {
        if (err) throw err;
        
        const fileStream = fs.createWriteStream(LOCAL_DUMP);
        stream.pipe(fileStream);
        
        stream.on('close', (code) => {
            console.log('✅ [Tahap 1] Berhasil menyedot data (' + fs.statSync(LOCAL_DUMP).size + ' bytes).');
            connLama.end();
            uploadAndDebug();
        });
    });
}).on('error', err => console.error('❌ Error VPS Lama:', err.message)).connect(VPS_LAMA);

function uploadAndDebug() {
    console.log('\n🚀 [Tahap 2] Mengirim data ke VPS Baru...');
    const connBaru = new Client();
    
    connBaru.on('ready', () => {
        connBaru.sftp((err, sftp) => {
            if (err) throw err;
            
            const remoteFile = '/root/vamos_debug_migrasi.sql';
            sftp.fastPut(LOCAL_DUMP, remoteFile, (errPut) => {
                if (errPut) throw errPut;
                console.log('✅ [Tahap 2] File berhasil diupload.');
                
                console.log('\n⏳ [Tahap 3] Memulihkan (Restore) database di VPS Baru menggunakan TCP localhost...');
                // Gunakan password auth via TCP localhost agar terhindar dari peer auth error
                const restoreCmd = `PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db < ${remoteFile} && rm ${remoteFile}`;
                
                connBaru.exec(restoreCmd, (errExec, streamExec) => {
                    if (errExec) throw errExec;
                    
                    let stdout = '';
                    let stderr = '';
                    streamExec.on('data', d => stdout += d.toString());
                    streamExec.stderr.on('data', d => stderr += d.toString());
                    
                    streamExec.on('close', () => {
                        console.log('\n✅ [Tahap 3] Selesai menjalankan restore.');
                        if (stderr) {
                            console.log('Stderr output (beberapa error constraint drop/skip wajar):');
                            console.log(stderr.substring(0, 1000)); // Batasi log biar ga kepanjangan
                        }
                        
                        console.log('\n🔍 Memeriksa kembali tabel User...');
                        connBaru.exec(`PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "SELECT count(*) FROM \\"User\\";"`, (err2, stream2) => {
                            stream2.on('data', d => process.stdout.write(d.toString()));
                            stream2.on('close', () => {
                                // Pastikan lisensi tetap aktif setelah restore!
                                console.log('\n🔒 Memastikan lisensi tetap aktif...');
                                const licenseCmd = `
                                    PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d vamos_pos_db -c "
                                        INSERT INTO \\"License\\" (id, \\"licenseKey\\", \\"hardwareId\\", \\"isActivated\\", \\"isActive\\", \\"createdAt\\", \\"updatedAt\\")
                                        VALUES ('vamos-cloud-license-001', 'VAMOS-VPS-UNLIMITED-2026', 'LINUX-X64-NODE-MACHINE', true, true, NOW(), NOW())
                                        ON CONFLICT (id) DO UPDATE SET \\"isActivated\\" = true, \\"isActive\\" = true, \\"hardwareId\\" = 'LINUX-X64-NODE-MACHINE';
                                    "
                                `;
                                connBaru.exec(licenseCmd, (err3, stream3) => {
                                    stream3.on('close', () => {
                                        console.log('✅ Lisensi dipastikan Aktif.');
                                        connBaru.end();
                                        fs.unlinkSync(LOCAL_DUMP);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }).on('error', err => console.error('❌ Error VPS Baru:', err.message)).connect(VPS_BARU);
}
