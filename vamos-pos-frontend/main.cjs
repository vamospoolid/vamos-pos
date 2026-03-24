const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "VAMOS POOL & CAFE - POS",
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0a'
  });

  // Remove menu
  Menu.setApplicationMenu(null);

  // Check if dist/index.html exists to decide whether to load file or URL
  const indexPath = path.join(__dirname, 'dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log("Loading from dist...");
    win.loadFile(indexPath);
  } else {
    console.log("Dist not found, loading from localhost:5173...");
    win.loadURL('http://localhost:5173').catch(() => {
        console.error("Failed to load localhost:5173. Make sure dev server is running or 'npm run build' has been executed.");
    });
  }

  win.maximize();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
