const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vamosElectron', {
    silentPrint: () => ipcRenderer.send('silent-print')
});
