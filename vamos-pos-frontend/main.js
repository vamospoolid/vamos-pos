const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function startBackend() {
    console.log('🚀 Memulai Backend Bridge Engine...');
    
    // Lokasi backend relatif terhadap __dirname atau cwd (sesuaikan jika dibundel)
    const backendPath = path.join(__dirname, '../vamos-pos-backend/dist/server.js');
    
    // Jalankan backend dengan environment IS_LOCAL_ELECTRON=true
    backendProcess = spawn('node', [backendPath], {
        env: { 
            ...process.env, 
            IS_LOCAL_ELECTRON: 'true',
            NODE_ENV: 'production',
            PORT: '3000'
        },
        stdio: 'inherit' // Teruskan log ke console electron untuk debugging
    });

    backendProcess.on('error', (err) => {
        console.error('❌ Gagal menjalankan Backend:', err);
    });

    backendProcess.on('exit', (code) => {
        console.log(`📡 Backend Bridge berhenti dengan kode: ${code}`);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'public/favicon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        title: "Vamos Pool POS"
    });

    // Menunggu sedikit agar backend siap sebelum memuat UI
    // Tapi kita langsung load saja karena Dashboard Cloud juga bisa mendeteksi sync hardware nanti
    win.loadURL('https://pos.vamospool.id');

    win.on('closed', () => {
        app.quit();
    });
}

app.on('ready', () => {
    // Jalankan Backend saat aplikasi dimulai
    startBackend();
    
    createWindow();
    
    const template = [
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});

// Pastikan proses backend ikut mati saat Electron ditutup
app.on('will-quit', () => {
    if (backendProcess) {
        console.log('🛑 Mematikan Backend Bridge Engine...');
        backendProcess.kill();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
