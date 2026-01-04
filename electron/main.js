import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // icon: path.join(__dirname, '../public/icon.png')
  });

  // In development, load from the Vite dev server
  // In production, load from the built index.html
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  // Detect if we are in dev mode by checking if we are connecting to localhost
  // or via an env var. A simple way is checking if ELECTRON_START_URL is set.
  if (process.env.ELECTRON_START_URL) {
      win.loadURL(process.env.ELECTRON_START_URL);
  } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
