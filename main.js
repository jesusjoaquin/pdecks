const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Require for sqlite3
var sqlite3 = require('sqlite3').verbose();

// The path in which the database file is stored.
var dbPath = './db/decks.db';
var db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("CREATE TABLE if NOT EXISTS presets (id INTEGER, name TEXT, url TEXT, application TEXT)");

  //db.run("INSERT INTO presets VALUES (1, 'deckname1', 'url goes here', 'application goes here')");

  console.log("All data in the database:");
  db.all("SELECT * FROM presets", function(err, row) {
     console.log(row);
  });

  db.close();
});

require('electron-context-menu')({
  prepend: (params, browserWindow) => [{
    label: 'Rainbow',
    visible: params. mediaType === 'image'
  }]
});

  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
var win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'src/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.once("ready-to-show", () => { win.show() });

  // Quit app when closed
  win.on('close', function () { app.quit() });

  // This funtion is in charge of various inter process connections.
  ipcWatcher();

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
    win = null
  })

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })

function reloadDecks() {
  var db = new sqlite3.Database(dbPath);

  db.all("SELECT * FROM presets", function(err, rows) {
    console.log("The following is being sent to renderer.");
    console.log(rows);
    win.webContents.send('refresh');
    win.webContents.send("resultMail", rows);
  });

  db.close();
}

// Contains all of the inter process connections, that must be watched for.
function ipcWatcher() {
  // ipc check for main window being loaded.
  ipcMain.on('mainWindow', () => {
    var db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM presets", function(err, rows) {
      console.log("The following is being sent to renderer.");
      console.log(rows);
      win.webContents.send("resultMail", rows);
    });

    db.close();
  });

  // Finds the largest id value.
  ipcMain.on('max', () => {
    console.log('searching for max');
    var db = new sqlite3.Database(dbPath);

    db.all("SELECT max(id) FROM presets", (err, row) => {
      console.log(row);
      win.webContents.send('maxVal', row[0]['max(id)']);
    });

    db.close();
  });

  // NOTE: When reload decks is called, new decks are not in database.
  // Updates the database with a newly added deck.
  ipcMain.on('update', function(err, values) {
    var db = new sqlite3.Database(dbPath);

    console.log("This stuff is about to be added:");
    console.log(values);
    var stmt = db.prepare("INSERT INTO presets (id, name, url, application) VALUES (?, ?, ?, ?)");
    stmt.run(values);
    stmt.finalize();

    db.close();

    reloadDecks();
  });

  ipcMain.on('verify-name', function(err, data) {
    var db = new sqlite3.Database(dbPath);

    console.log("Here comes the data with name to be verified:");
    console.log(data);

    var stmt = db.prepare("SELECT * FROM presets WHERE name = (?)");
    stmt.all(data[1], (err, row) => {
      var idStatus;

      if (row[0] === undefined) {
        idStatus = null;
      } else {
        console.log('-----found name-----');
        console.log(row[0]);
        idStatus = row[0].id;
      }

      data[0] = idStatus;

      win.webContents.send('name-verified', data);
    });

    stmt.finalize();

    db.close();
  });

  // Refreshes the listed decks, if code 'refresh' from renderer process.
  // ipcMain.on('refresh', function(event) {
  //   var db = new sqlite3.Database(dbPath);
  //
  //   db.all("SELECT * FROM presets", function(err, rows) {
  //     console.log("The following is being sent to renderer.");
  //     console.log(rows);
  //     win.webContents.send('refresh');
  //     win.webContents.send("resultMail", rows);
  //   });
  //
  //   db.close();
  // });

  // ipcMain.on('closeAddWindow', (event) => {
  //   win.webContents.send('closeAddWindow');
  // });

  ipcMain.on('addjs-redirect', (err, value) => {
    win.webContents.send('addjs-channel', value);
  });
}
