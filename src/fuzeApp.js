"use strict";

const {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  Menu,
  Dialog
} = require("electron");

const windowStateKeeper = require("electron-window-state");
const path = require("path");
const _ = require("lodash");
const Bus = require("electron-eventbus");
const eventBus = new Bus();
const fs = require("fs");
const settings = require("electron-settings");
const universalLogin = require("./app/js/util/universalLogin");
// Make this available in all modules
const log = require("./app/js/util/util.log");

require("electron-debug")({ showDevTools: true });
require("./lib/log");

global.pjson = require("./package.json");

app.setName(pjson.productName);

// Manage unhandled exceptions as early as possible
process.on("uncaughtException", e => {
  console.error(`Caught unhandled exception: ${e}`);
  // Dialog.showErrorBox('Caught unhandled exception', e.message || 'Unknown error message')
  app.quit();
});

// Load build target configuration file
try {
  const config = require("./config/config.json");
  _.merge(global.pjson.config, config);

} catch (e) {
  console.error(`Caught unhandled exception: ${e}`);
  console.log("No config file loadedPlease Contact Support");
  app.quit();
}

const isDev = require("electron-is-dev") || pjson.config.debug;

global.appSettings = pjson.config;

if (isDev) {
  console.info("Running in development");
} else {
  console.info("Running in production");
}

// Adds debug features like hotkeys for triggering dev tools and reload
// (disabled in production, unless the menu item is displayed)
require("electron-debug")({
  enabled: pjson.config.debug || isDev || false
});

console.info("AppName Name ==  " + app.getName());
console.info("Product Name ==  " + pjson.productName);
console.info("User Locale ==  " + app.getLocale());

global.mainWindow = null;
global.loginWindow = null;
global.settingsWindow = null;

let infoWindow = null;

app.setName(pjson.productName);

function initialize() {
  const shouldQuit = makeSingleInstance();
  if (shouldQuit) return app.quit();

  function onClosed() {
    mainWindow = null;
    infoWindow = null;
    settingsWindow = null;
  }

  function isUserAuthenticated(callback) {
    const filename = settings.file();
    console.log("is this where I would check for settings " + filename);

    fs.exists(filename, function(exists) {
      if (exists) {
        fs.stat(filename, function(err, stats) {
          if (stats.isDirectory()) {
            console.log(
              "isUserAuthenticated: " + filename + " : is a directory"
            );
            callback(false);
          } else {
            //Verify Token
            const wardenToken = settings.get("userData.wardenToken");
            console.log("getUserSettings: wardenToken == " + wardenToken);

            if (wardenToken != null && wardenToken != "undefined") {
              console.log("Warden token exists");
              callback(true);
            } else {
              callback(false);
            }
          }
        });
      } else {
        callback(false);
        console.log("File does not exist");
      }
    });
  }

  // MainWindow Section
  function createLoginWindow() {
    // Load the previous window state with fallback to defaults
    const mainWindowState = windowStateKeeper({
      defaultWidth: 440, //420
      defaultHeight: 680 // 680
    });

    const win = new BrowserWindow({
      transparent: false,
      width: 440,
      height: 680,
      resizable: false,
      frame: true,
      x: mainWindowState.x,
      y: mainWindowState.y,
      title: app.getName(),
      icon: path.join(__dirname, "/src/assets/icons/png/64x64.png"),
      show: true, // Hide your application until your page has loaded
      webPreferences: {
        nodeIntegration: false, // Disabling node integration allows to use libraries such as jQuery/React, etc
        preload: path.resolve(path.join(__dirname, "preload.js"))
      }
    });

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(win);

    const openwinurl = pjson.config.wardenUniversalLoginUrlLive; //"https://auth.thinkingphones.com?accessToken=2.FEV--FcAJnKvcGB.YXBwbGljYXRpb246NlJzampuV0RpUjpOM0NKdlZtQ2lS&redirectUri=http%3A%2F%2Fws.thinkingphones.com";
    win.loadURL(openwinurl, {});

    win.webContents.on("did-get-redirect-request", function(
      event,
      oldUrl,
      newUrl,
      isMainFrame
    ) {
      console.log("Redirect URL::" + newUrl);
      if (newUrl.substring(0, 28) == "http://ws.thinkingphones.com") {
        if (process.platform !== "win32") {
          console.log("NOT Win32");
          win.close();
        }

        universalLogin.replaceToken(newUrl, function(results) {
          settings.set("userData.wardenToken", results);
          if (process.platform !== "win32") {
            console.log("NOT Win32");
            mainWindow = createFconMainWindow(results);
          } else {
            console.log("Win32");
            mainWindow = createFconMainWindow(results);
            win.close();
          }
        });
      }
    });

    return win;
  }

  // MainWindow Section
  function createFconMainWindow(wardenData) {
    // Load the previous window state with fallback to defaults
    const mainWindowState = windowStateKeeper({
      defaultWidth: 440, //420
      defaultHeight: 680 // 680
    });

    //'icon': path.join(__dirname, '/src/assets/img/icon.png'),
    //'titleBarStyle': 'hidden-inset',
    const fWin = new BrowserWindow({
      transparent: false,
      width: 440,
      height: 680,
      resizable: false,
      frame: true,
      x: mainWindowState.x,
      y: mainWindowState.y,
      title: app.getName(),
      icon: path.join(__dirname, "src/assets/icons/png/64x64.png"),
      show: true, // Hide your application until your page has loaded
      webPreferences: {
        nodeIntegration: pjson.config.nodeIntegration || true, // Disabling node integration allows to use libraries such as jQuery/React, etc
        preload: path.resolve(path.join(__dirname, "preload.js"))
      }
    });

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(fWin);

    // Remove file:// if you need to load http URLs
    fWin.loadURL(`file://${__dirname}/${pjson.config.mainurl}`, {});
    console.log(pjson.config.mainurl);

    //letnew_window = window.open('https://auth.thinkingphones.com?accessToken=2.M9G01Num4hZ08KQ.YXBwbGljYXRpb246dmh5NE5MMUU4UToyMU5VUk5Cd2NQ&redirectUri=https%3A%2F%2Fwblogin.gts.fuze.com');
    //new_window.focus();
    fWin.on("closed", onClosed);

    // Then, when everything is loaded, show the window and focus it so it pops up for the user
    // Yon can also use: win.webContents.on('did-finish-load')
    fWin.on("ready-to-show", () => {
      fWin.show();
      fWin.focus();
    });

    fWin.on("unresponsive", function() {
      // In the real world you should display a box and do something
      console.warn("The windows is not responding");
    });

    fWin.webContents.on(
      "did-fail-load",
      (error, errorCode, errorDescription) => {

        console.log('Failed to load...' + error + " " + errorCode + " " + errorDescription);
        let errorMessage;

        if (errorCode === -105) {
          errorMessage =
            errorDescription ||
            "[Connection Error] The host name could not be resolved, check your network connection";
          console.error(errorMessage);
        } else {
          errorMessage = errorDescription || "Unknown error";
          console.error(errorMessage);
        }

        error.sender.loadURL(`file://${__dirname}/app/html/error.html`);

        fWin.webContents.on("did-finish-load", () => {
          fWin.webContents.send("app-error", errorMessage);
        });
      }
    );

    fWin.webContents.on("crashed", () => {
      console.error("The browser window has just crashed");
    });

    fWin.webContents.on("did-finish-load", () => {
      fWin.webContents.send("contents-loaded", wardenData);
    });

    //
    return fWin;
  }

    // MainWindow Section
    function createSettingsWindow() {
      const mainWindowState = windowStateKeeper({
        defaultWidth: 440,
        defaultHeight: 680
      });
  
      const settingsWindow = new BrowserWindow({
        transparent: false,
        width: 440,
        height: 680,
        resizable: false,
        frame: true,
        x: mainWindowState.x,
        y: mainWindowState.y,
        title: app.getName(),
        icon: path.join(__dirname, "src/assets/icons/png/64x64.png"),
        show: true
      });

      mainWindowState.manage(settingsWindow);
      settingsWindow.loadURL(`file://${__dirname}/${pjson.config.settingsurl}`, {});
  
      // Then, when everything is loaded, show the window and focus it so it pops up for the user
      settingsWindow.on("ready-to-show", () => {
        settingsWindow.show();
        settingsWindow.focus();
      });
  
      settingsWindow.on("unresponsive", function() {
        console.warn("The windows is not responding");
      });
  
      settingsWindow.webContents.on("crashed", () => {
        console.error("The browser window has just crashed");
      });
  
      settingsWindow.webContents.on("did-finish-load", () => {
      });
  
      return settingsWindow;
    }

  //Reset Settings
  function resetSettings(callback) {
    const settingsFilePath = settings.file();
    console.log("\n settingsFilePath : " + settingsFilePath);
    try {
      fs.unlinkSync(settingsFilePath);
    } catch (err) {
      console.error("Failed to Remove the file " + settingsFilePath);
    }
    settings.clearPath();
    callback();
  }

  app.on("window-all-closed", () => {});

  app.on("activate", () => {
    isUserAuthenticated(function(res) {
      console.log(res);
      if (res == true) {
        if (mainWindow === null) {
          mainWindow = createFconMainWindow(
            settings.get("userData.wardenToken")
          );
        }
      } else {
        if (loginWindow === null) {
          loginWindow = createLoginWindow();
        }
      }
    });
  });

  app.on("ready", () => {
    Menu.setApplicationMenu(createMenu());

    isUserAuthenticated(function(res) {
      if (res == true) {
        mainWindow = createFconMainWindow(settings.get("userData.wardenToken"));
      } else {
        loginWindow = createLoginWindow();
      }
    });
  });

  app.on("will-quit", () => {});

  //////////////////////////////////////////////////////////////////////////////////////
  // Main  Window ipcRender Events
  //////////////////////////////////////////////////////////////////////////////////////

  // Reset Configuration
  ipcMain.on("reset-config", () => {
    resetSettings(function() {
      loginWindow = createLoginWindow();
      mainWindow.close();
    });
  });

  //////////////////////////////////////////////////////////////////////////////////////
  // Info Window
  //////////////////////////////////////////////////////////////////////////////////////
  // Info Window
  ipcMain.on("open-info-window", () => {
    if (infoWindow) {
      return;
    }
    infoWindow = new BrowserWindow({
      width: 320,
      height: 420,
      resizable: false
    });

    infoWindow.loadURL(`file://${__dirname}/${pjson.config.infourl}`);

    infoWindow.on("closed", () => {
      infoWindow = null;
    });
  });

  //////////////////////////////////////////////////////////////////////////////////////
  // Settings Window
  //////////////////////////////////////////////////////////////////////////////////////

  ipcMain.on('open-settings', () => {
    settingsWindow = createSettingsWindow();
  });

  ipcMain.on('close-settings', () => {
    settingsWindow.close();
  })


}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  return app.makeSingleInstance(() => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createMenu() {
  return Menu.buildFromTemplate(require("./lib/menu"));
}

initialize();
