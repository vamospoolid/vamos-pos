const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0a0a0a',
        title: "VAMOS POOL & CAFE - POS",
        icon: path.join(__dirname, 'public/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // SEMBUNYIKAN MENU BAR AGAR MODERN
    win.setMenuBarVisibility(false);

    // PAKSA LOAD URL PRODUKSI via HTTP (Bypass SSL issue)
    win.loadURL('http://pos.vamospool.id').catch(err => {
        console.error('Failed to load production URL:', err);
    });

    win.maximize();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
