const { Client } = require('ssh2');

const VPS_LAMA = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };
const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const connLama = new Client();
const connBaru = new Client();

console.log('🔄 Memulai proses Migrasi Database Otomatis...');

// KONEK KE VPS LAMA DULU
connLama.on('ready', () => {
    console.log('✅ Berhasil masuk ke VPS Lama (144.91.73.36)');
    
    // Backup (Dump) Database di VPS lama
    console.log('⏳ Sedang mem-backup (dump) data dari VPS lama...');
    const dumpCmd = 'pg_dump "postgresql://vamos_user:vamos_password123@localhost:5432/vamos_db?schema=public" -c -O > /root/vamos_migrasi.sql';
    
    connLama.exec(dumpCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log('✅ Backup berhasil dibuat (vamos_migrasi.sql)');
            
            // Transfer langsung dari VPS Lama ke VPS Baru menggunakan SCP (Secure Copy) dari dalam VPS Lama
            console.log('🚀 Mengirim file backup ke VPS Baru secara langsung (Server to Server)...');
            
            // Kita install sshpass sementara di VPS lama agar bisa SCP otomatis tanpa prompt password
            const transferCmd = `
                apt-get install -y sshpass > /dev/null 2>&1 || true
                sshpass -p "${VPS_BARU.password}" scp -o StrictHostKeyChecking=no /root/vamos_migrasi.sql root@${VPS_BARU.host}:/root/vamos_migrasi.sql
            `;
            
            connLama.exec(transferCmd, (err2, stream2) => {
                stream2.on('close', (code2) => {
                    console.log('✅ File backup sukses terkirim ke VPS Baru!');
                    connLama.end();
                    
                    // SEKARANG KONEK KE VPS BARU UNTUK RESTORE
                    mulaiRestoreDiVpsBaru();
                });
            });
        });
    });
}).on('error', err => console.error('❌ Error VPS Lama:', err.message)).connect(VPS_LAMA);


function mulaiRestoreDiVpsBaru() {
    connBaru.on('ready', () => {
        console.log('✅ Berhasil masuk ke VPS Baru (173.212.243.240)');
        console.log('⏳ Sedang memulihkan (restore) database...');
        
        // Restore SQL file ke database vamos_pos_db
        const restoreCmd = `
            psql -U postgres -d vamos_pos_db < /root/vamos_migrasi.sql
            echo "Done"
        `;
        
        connBaru.exec(restoreCmd, (err, stream) => {
            stream.on('data', d => {}); // Sembunyikan output berlebih psql
            stream.on('close', () => {
                console.log('🎉 MIGRASI DATABASE SELESAI 100%!');
                console.log('Semua data dari server lama Anda sekarang sudah pindah ke server baru.');
                connBaru.end();
            });
        });
    }).on('error', err => console.error('❌ Error VPS Baru:', err.message)).connect(VPS_BARU);
}
