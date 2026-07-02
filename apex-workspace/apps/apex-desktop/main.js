const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we are in dev mode
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,          // Supprime les bordures et la barre de titre
    transparent: true,     // Active la transparence de la fenêtre
    hasShadow: false,      // Désactive l'ombre portée (évite les bordures blanches sur Windows)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    // Charge l'application Angular servie localement
    win.loadURL('http://localhost:4200');
  } else {
    // Charge le build de production d'Angular
    win.loadFile(path.join(__dirname, '../../dist/apps/apex-hud/browser/index.html'));
  }

  // Quitter toute l'application quand la fenêtre est fermée
  win.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
