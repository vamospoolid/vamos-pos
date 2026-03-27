const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// isPackaged  → apakah ini EXE yang sudah di-build electron-builder?
//               Digunakan untuk menentukan PATH file backend (vamous-pos.exe)
const isPackaged = app.isPackaged;

// isDevVite   → apakah kita load Vite (localhost:5173) atau backend (localhost:3000)?
//               false jika: sudah package ATAU VAMOS_PROD_MODE=1 (via BAT)
//               true  jika: development murni (jalankan npm run dev dulu)
const isDevVite = !isPackaged && !process.env.VAMOS_PROD_MODE;

let backendProcess = null;

function startBackend() {
    const fs = require('fs');
    const dotenv = require('dotenv');

    // ─── PATH: gunakan isPackaged (BUKAN isDevVite) ──────────────────────────
    // Saat unpackaged (dev atau BAT), lokasi EXE selalu di ../vamos-pos-backend/
    // Saat packaged, lokasi EXE ada di dalam resources/ bawaan electron-builder
    const backendPath = isPackaged
        ? path.join(process.resourcesPath, 'backend', 'vamous-pos.exe')
        : path.join(__dirname, '../vamos-pos-backend/vamous-pos.exe');

    const internalEnv = isPackaged
        ? path.join(process.resourcesPath, 'backend', '.env')
        : path.join(__dirname, '../vamos-pos-backend/.env');

    // External .env: di folder yang sama dengan EXE yang user klik
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();
    const externalEnv = path.join(portableDir, '.env');

    // 1. Muat Internal .env (Default)
    if (fs.existsSync(internalEnv)) {
        console.log('Loading internal .env from:', internalEnv);
        Object.assign(process.env, dotenv.parse(fs.readFileSync(internalEnv)));
    }

    // 2. Timpa dengan External .env (jika user menaruh .env di sebelah EXE)
    if (fs.existsSync(externalEnv)) {
        console.log('Overriding with external .env from:', externalEnv);
        Object.assign(process.env, dotenv.parse(fs.readFileSync(externalEnv)));
    }

    console.log('Starting backend engine at:', backendPath);

    if (!fs.existsSync(backendPath)) {
        console.error('ERROR: vamous-pos.exe tidak ditemukan di:', backendPath);
        dialog.showErrorBox(
            'Backend Error',
            `vamous-pos.exe tidak ditemukan.\n\nPath: ${backendPath}\n\nJalankan:\ncd vamos-pos-backend && npm run build && npm run bundle`
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
                PRISMA_QUERY_ENGINE_LIBRARY: enginePath
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
        icon: path.join(__dirname, 'public/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        }
    });

    win.setMenuBarVisibility(false);

    if (!isDevVite) {
        // ─── PRODUCTION / BAT MODE ──────────────────────────────────────────
        // Poll backend setiap 300ms sampai siap → load segera tanpa hardcode wait
        let attempts = 0;
        const maxAttempts = 30; // max 9 detik (30 x 300ms)

        const tryLoad = () => {
            attempts++;
            const req = http.get('http://localhost:3000', () => {
                // Backend sudah merespons — muat sekarang!
                win.loadURL('http://localhost:3000').catch(() => {
                    win.loadFile(path.join(__dirname, 'dist/index.html'));
                });
            });
            req.on('error', () => {
                if (attempts < maxAttempts) {
                    setTimeout(tryLoad, 300);
                } else {
                    // Fallback: paksa load walaupun backend belum merespons
                    win.loadURL('http://localhost:3000').catch(() => {
                        win.loadFile(path.join(__dirname, 'dist/index.html'));
                    });
                }
            });
            req.setTimeout(500, () => req.destroy());
        };

        setTimeout(tryLoad, 500); // Beri 500ms agar proses backend sempat spawn
    } else {
        // ─── DEVELOPMENT MODE ────────────────────────────────────────────────
        // Jalankan dulu: npm run dev (di vamos-pos-frontend) sebelum electron
        win.loadURL('http://localhost:5173');
    }

    win.maximize();
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
