const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'public/favicon.ico'), // Opsional: Pastikan file ikon ada
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true, // Sembunyikan menu bar agar lebih bersih
        title: "Vamos Pool POS"
    });

    // PENTING: Arahkan langsung ke domain produksi Anda (POS Frontend)
    win.loadURL('https://pos.vamospool.id');

    // Menangani penutupan jendela
    win.on('closed', () => {
        app.quit();
    });
}

// Tambahkan menu basic jika Anda butuh reload (F5) atau zoom
app.on('ready', () => {
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
