import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import { logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let tray: Tray | null = null;

function startServer() {
    // Jalankan backend (Bridge) sebagai child process
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = fork(serverPath);

    serverProcess.on('error', (err) => {
        console.error('Failed to start server process:', err);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Vamos POS - Billiard Management",
        icon: path.join(__dirname, '../public/logo.png'), // Pastikan ada logo
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        backgroundColor: '#0a0a0a'
    });

    // Buka website POS langsung
    mainWindow.loadURL('https://pos.vamospool.id');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Hilangkan menu default
    Menu.setApplicationMenu(null);
}

// Tray icon agar aplikasi bisa jalan di background
function createTray() {
    tray = new Tray(path.join(__dirname, '../public/logo.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => { mainWindow?.show(); } },
        { label: 'Restart Bridge', click: () => { 
            serverProcess?.kill();
            startServer();
        }},
        { type: 'separator' },
        { label: 'Exit', click: () => {
            (app as any).isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setToolTip('Vamos POS Bridge');
    tray.setContextMenu(contextMenu);
}

app.on('ready', () => {
    startServer();
    createWindow();
    // createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        serverProcess?.kill();
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Pastikan proses backend mati saat aplikasi ditutup
app.on('before-quit', () => {
    serverProcess?.kill();
});
