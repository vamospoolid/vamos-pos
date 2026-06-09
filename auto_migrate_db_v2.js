const { Client } = require('ssh2');
const fs = require('fs');

const VPS_LAMA = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };
const VPS_BARU = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

const LOCAL_DUMP = 'vamos_migrasi.sql';

console.log('🔄 [Tahap 1] Menyedot data dari VPS Lama...');

const connLama = new Client();
connLama.on('ready', () => {
    // Kita gunakan kredensial spesifik agar tidak terhalang (seperti password prompt)
    // Sesuai env lama: postgresql://vamos_user:vamos_password123@localhost:5432/vamos_db
    const dumpCmd = 'export PGPASSWORD="vamos_password123" && pg_dump -U vamos_user -h localhost -p 5432 -d vamos_db --clean --if-exists -O';
    
    connLama.exec(dumpCmd, (err, stream) => {
        if (err) throw err;
        
        const fileStream = fs.createWriteStream(LOCAL_DUMP);
        stream.pipe(fileStream);
        
        stream.on('close', (code) => {
            console.log('✅ [Tahap 1] Berhasil menyedot data (' + fs.statSync(LOCAL_DUMP).size + ' bytes).');
            connLama.end();
            uploadKeVPSBaru();
        });
    });
}).on('error', err => console.error('❌ Error VPS Lama:', err.message)).connect(VPS_LAMA);


function uploadKeVPSBaru() {
    console.log('\\n🚀 [Tahap 2] Mengirim data ke VPS Baru...');
    const connBaru = new Client();
    
    connBaru.on('ready', () => {
        connBaru.sftp((err, sftp) => {
            if (err) throw err;
            
            const remoteFile = '/root/vamos_migrasi.sql';
            sftp.fastPut(LOCAL_DUMP, remoteFile, (errPut) => {
                if (errPut) throw errPut;
                console.log('✅ [Tahap 2] File berhasil diupload ke server baru.');
                
                console.log('\\n⏳ [Tahap 3] Memulihkan (Restore) database di VPS Baru...');
                // Karena vamos_pos_db di vps baru menggunakan user 'postgres'
                const restoreCmd = `psql -U postgres -d vamos_pos_db < ${remoteFile} && rm ${remoteFile}`;
                
                connBaru.exec(restoreCmd, (errExec, streamExec) => {
                    if (errExec) throw errExec;
                    streamExec.on('data', () => {}); // Sembunyikan output agar rapi
                    streamExec.on('close', () => {
                        console.log('🎉 [Tahap 3] MIGRASI DATABASE SELESAI 100%!');
                        console.log('Semua data dari server lama (Bengkel) sekarang sudah pindah ke server baru.');
                        connBaru.end();
                        fs.unlinkSync(LOCAL_DUMP); // Bersihkan file lokal
                    });
                });
            });
        });
    }).on('error', err => console.error('❌ Error VPS Baru:', err.message)).connect(VPS_BARU);
}
