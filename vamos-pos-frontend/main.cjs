const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');

// VAMOS CONFIGURATION
const CLOUD_URL = 'https://pos.vamospool.id';
const LOCAL_BACKEND_PORT = 3000;

// isPackaged: detect if running as built EXE
const isPackaged = app.isPackaged;

let backendProcess = null;

function startBackend() {
    // 1. DETERMINE PATHS
    const backendPath = isPackaged
        ? path.join(process.resourcesPath, 'backend', 'vamous-pos.exe')
        : path.join(__dirname, '../vamos-pos-backend/vamous-pos.exe');

    const internalEnv = isPackaged
        ? path.join(process.resourcesPath, 'backend', '.env')
        : path.join(__dirname, '../vamos-pos-backend/.env');

    // 2. LOAD ENVIRONMENT VARIABLES
    if (fs.existsSync(internalEnv)) {
        Object.assign(process.env, dotenv.parse(fs.readFileSync(internalEnv)));
    }

    // External .env in same directory as portable EXE
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();
    const externalEnv = path.join(portableDir, '.env');
    if (fs.existsSync(externalEnv)) {
        Object.assign(process.env, dotenv.parse(fs.readFileSync(externalEnv)));
    }

    console.log('Starting Vamos Backend at:', backendPath);

    if (!fs.existsSync(backendPath)) {
        // Fallback for dev: if exe not found, maybe they want to run via node?
        // But for "wrapping into 1 app", we expect the EXE to be there.
        if (!isPackaged) {
           console.warn('Backend EXE not found, please build it first.');
           return;
        }
        
        dialog.showErrorBox(
            'Backend Error',
            `vamous-pos.exe tidak ditemukan.\nPath: ${backendPath}`
        );
        return;
    }

    try {
        const enginePath = path.join(path.dirname(backendPath), 'query_engine-windows.dll.node');

        backendProcess = spawn(backendPath, [], {
            cwd: path.dirname(backendPath),
            stdio: 'inherit',
            windowsHide: true,
            env: {
                ...process.env,
                IS_LOCAL_ELECTRON: 'true',
                PRISMA_QUERY_ENGINE_LIBRARY: enginePath,
                NODE_ENV: 'production'
            }
        });

        backendProcess.on('error', (err) => {
            console.error('Failed to start backend engine:', err);
            dialog.showErrorBox('Backend Error', 'Gagal menyalakan engine POS: ' + err.message);
        });

        backendProcess.on('exit', (code) => {
            console.log(`Backend process exited with code ${code}`);
        });

    } catch (e) {
        console.error('Exception starting backend:', e);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0a0a0a',
        title: 'VAMOS POOL & CAFE - SMART POS',
        icon: path.join(__dirname, 'public/favicon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Allow connecting to local bridge from remote URL
        }
    });

    win.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);
    win.maximize();

    // VAMOS CLOUD MODE: Load the VPS URL
    // This is the "wrap into 1 app" essence where Cloud is the UI, Local is the Bridge.
    const targetUrl = process.env.CLOUD_BASE_URL || CLOUD_URL;
    
    console.log('Loading Cloud UI:', targetUrl);

    win.loadURL(targetUrl).catch((err) => {
        console.warn('Failed to load Cloud URL, fallback to local...', err);
        // Fallback to local bridge if offline
        win.loadURL(`http://localhost:${LOCAL_BACKEND_PORT}`).catch(() => {
            const indexPath = path.join(__dirname, 'dist/index.html');
            if (fs.existsSync(indexPath)) {
                win.loadFile(indexPath);
            } else {
                win.loadHTML(`
                    <body style="background:#0a0a0a; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
                        <div style="text-align:center">
                            <h1>VAMOS POS - OFFLINE</h1>
                            <p>Gagal terhubung ke Cloud dan Local Engine belum siap.</p>
                            <button onclick="location.reload()">Coba Lagi</button>
                        </div>
                    </body>
                `);
            }
        });
    });

    // Option to open dev tools for debugging if needed (Ctrl+Shift+I)
    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            win.webContents.openDevTools();
        }
    });
}

app.whenReady().then(() => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (backendProcess) backendProcess.kill();
});
