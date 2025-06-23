const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Keep it false for security
            contextIsolation: true
        }
    });

    // Open DevTools in development mode
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Load React build
    mainWindow.loadURL(`file://${path.join(__dirname, 'build', 'index.html')}`);

    mainWindow.on('closed', () => (mainWindow = null));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
