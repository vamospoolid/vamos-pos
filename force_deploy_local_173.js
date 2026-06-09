const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const VPS_BARU = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const FILES_TO_DEPLOY = [
    // Backend files
    'vamos-pos-backend/src/modules/sessions/session.controller.ts',
    'vamos-pos-backend/src/modules/sessions/session.route.ts',
    'vamos-pos-backend/src/modules/sessions/session.service.ts',
    'vamos-pos-backend/src/modules/system/system.controller.ts',
    'vamos-pos-backend/src/modules/system/system.route.ts',
    'vamos-pos-backend/src/utils/backup.service.ts',
    
    // Frontend files
    'vamos-pos-frontend/src/App.tsx',
    'vamos-pos-frontend/src/Challenges.tsx',
    'vamos-pos-frontend/src/Settings.tsx',
    'vamos-pos-frontend/src/Waitlist.tsx',
    'vamos-pos-frontend/src/Reports.tsx',
    'vamos-pos-frontend/src/Incomes.tsx',
    'vamos-pos-frontend/src/Expenses.tsx',
    'vamos-pos-frontend/src/Competitions.tsx',
    'vamos-pos-frontend/src/utils/dialog.tsx'
];

const LOCAL_BASE_DIR = 'd:\\APPS\\vamosmobile';
const REMOTE_BASE_DIR = '/var/www/vamos';

console.log('🚀 Memulai deployment file lokal (Split Bill & Socket Fixes) ke VPS Baru...');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploadedCount = 0;
        
        function uploadNext() {
            if (uploadedCount >= FILES_TO_DEPLOY.length) {
                console.log('\n✅ Semua file lokal berhasil diupload ke VPS!');
                buildAndRestart();
                return;
            }
            
            const relPath = FILES_TO_DEPLOY[uploadedCount];
            const localFile = path.join(LOCAL_BASE_DIR, relPath);
            const remoteFile = path.join(REMOTE_BASE_DIR, relPath).replace(/\\/g, '/');
            
            console.log(`📤 Mengirim: ${relPath} -> ${remoteFile}`);
            
            const remoteDir = path.dirname(remoteFile).replace(/\\/g, '/');
            
            conn.exec(`mkdir -p ${remoteDir}`, (errDir) => {
                if (errDir) {
                    console.error(`❌ Gagal membuat direktori ${remoteDir}:`, errDir.message);
                    conn.end();
                    return;
                }
                
                sftp.fastPut(localFile, remoteFile, (errPut) => {
                    if (errPut) {
                        console.error(`❌ Gagal mengirim ${relPath}:`, errPut.message);
                        conn.end();
                        return;
                    }
                    uploadedCount++;
                    uploadNext();
                });
            });
        }
        
        uploadNext();
    });
}).on('error', err => console.error('❌ Error SSH:', err.message)).connect(VPS_BARU);

function buildAndRestart() {
    console.log('\n⏳ Menjalankan kompilasi (build) backend dan frontend di VPS...');
    
    const buildCmd = `
        source ~/.bashrc 2>/dev/null || true
        source ~/.nvm/nvm.sh 2>/dev/null || true
        export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

        echo "=== 1. BUILD BACKEND ==="
        cd ${REMOTE_BASE_DIR}/vamos-pos-backend
        npm run build
        
        echo "\\n=== 2. RESTART BACKEND ==="
        pm2 restart vamos-backend --update-env
        
        echo "\\n=== 3. BUILD FRONTEND POS ==="
        cd ${REMOTE_BASE_DIR}/vamos-pos-frontend
        npm run build
        
        echo "\\n🎉 PROSES SELESAI!"
    `;
    
    conn.exec(buildCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\n🔌 Koneksi ditutup dengan exit code:', code);
            conn.end();
        });
    });
}
