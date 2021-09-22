const { app, BrowserWindow } = require('electron')
const path = require('path')

// Place holders for our windows so they don't get garbage collected.
let mainWindow = null;


// Create simple menu for easy devtools access, and for demo
const menuTemplateDev = [
  {
    label: 'Options',
    submenu: [
      {
        label: 'Open Dev Tools',
        click() {
          mainWindow.openDevTools();
        },
      },
    ],
  },
];

async function createWindow() {


  // Define our main window size
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      // nodeIntegration: true,
    }
  });

  // mainWindow.webContents.on('did-fail-load', () => {
  //   console.log('did-fail-load');
  // });


  // mainWindow.removeMenu();
  // mainWindow.setAlwaysOnTop(true);

  // if (isDevMode) {
  //   // Set our above template to the Menu Object if we are in development mode, dont want users having the devtools.
  //   Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplateDev));
  //   // If we are developers we might as well open the devtools by default.
  //   mainWindow.webContents.openDevTools();
  // }
  const startUrl = path.resolve('index.html');
  setTimeout(() => {
    mainWindow.loadURL(`file://${__dirname}/build/index.html`);
  }, 2000);
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.show();
  });
  mainWindow.loadURL(`file://${__dirname}/build/index.html`);


}

app.whenReady().then(() => {
  console.log('ready')
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})