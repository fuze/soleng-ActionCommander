'use strict'

const { app, BrowserWindow, ipcMain, ipcRenderer, Menu, Dialog } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path 				= require('path');
const _ 				= require('lodash');
const Bus 				= require('electron-eventbus');
const eventBus 			= new Bus();
const fs 				= require('fs');
const settings 			= require('electron-settings');
const universalLogin 	= require('./app/js/util/universalLogin')
// Make this available in all modules
const log 				= require('./app/js/util/util.log')
//
require('electron-debug')({showDevTools: true});
require('./lib/log')
global.pjson = require('./package.json');

app.setName(pjson.productName || 'Fuze Connect')

// Manage unhandled exceptions as early as possible
process.on('uncaughtException', (e) => {
	console.error(`Caught unhandled exception: ${e}`)
	// Dialog.showErrorBox('Caught unhandled exception', e.message || 'Unknown error message')
	app.quit()
})

// Load build target configuration file
try {
	//var config = require(process.cwd() +'/src/config/config.json')
	var config = require('./config/config.json')
	console.log(`config: ${config}`);
	_.merge(global.pjson.config, config)
	//console.log('Config file loaded ==  ' + JSON.stringify(pjson.config, null, 2))
} catch (e) {
	console.error(`Caught unhandled exception: ${e}`)
	console.log('No config file loadedPlease Contact Support')
	app.quit()
}

const isDev = (require('electron-is-dev') || pjson.config.debug)
console.log()
global.appSettings = pjson.config

if (isDev) {
	console.info('Running in development')
} else {
	console.info('Running in production')
}

// Adds debug features like hotkeys for triggering dev tools and reload
// (disabled in production, unless the menu item is displayed)
require('electron-debug')({
	enabled: pjson.config.debug || isDev || false
})

console.info('AppName Name ==  ' + app.getName())
console.info('Product Name ==  ' + pjson.productName)
console.info('User Locale ==  ' + app.getLocale())

global.mainWindow = null;
global.loginWindow = null;
let infoWindow = null;
global.passWindow = null;
global.utilWindow = null;
global.crmTypeWindow = null;

app.setName(pjson.productName || 'Fuze Connect')

function initialize () {
	var shouldQuit = makeSingleInstance()
	if (shouldQuit) return app.quit()

	function onClosed () {
		// Dereference used windows
		// for multiple windows store them in an array
		mainWindow = null;
		infoWindow = null;
		passWindow = null;
		utilWindow = null;
		crmTypeWindow = null;
	}


	function isUserAuthenticated (callback) {
		var filename = settings.file()
		console.log('is this where I would check for settings ' + filename)

		fs.exists(filename, function(exists) {
			if (exists) {
				fs.stat(filename, function (err, stats) {
					if (stats.isDirectory()) {
						console.log('isUserAuthenticated: ' + filename + ' : is a directory');
						callback(false);
					} else {
						//Verify Token
						var wardenToken = settings.get('userData.wardenToken');
						console.log('getUserSettings: wardenToken == ' + wardenToken)

						if (wardenToken!=null && wardenToken!='undefined')
						{
							console.log("Warden token exists")
							callback(true);
						}
						else
						{
							callback(false);
						}
					}
				})
			}
			else
			{
				callback(false);
				console.log("File does not exist")
			}
		})
	}

	// MainWindow Section
	function createLoginWindow () {
		// Load the previous window state with fallback to defaults
		let mainWindowState = windowStateKeeper({
			defaultWidth: 440,  //420
			defaultHeight: 680 // 680
		})

		//'icon': path.join(__dirname, '/src/assets/img/icon.png'),
		//'titleBarStyle': 'hidden-inset',
		const win = new BrowserWindow({
			"transparent" : false,
			'width': 440,
			'height': 680,
			'resizable': false,
			'frame': true,
			'x': mainWindowState.x,
			'y': mainWindowState.y,
			'title': app.getName(),
			'icon': path.join(__dirname, '/src/app/images/Fuze-icon-purple-128.png'),
			'show': true, // Hide your application until your page has loaded
			'webPreferences': {
				'nodeIntegration': false, // Disabling node integration allows to use libraries such as jQuery/React, etc
				'preload': path.resolve(path.join(__dirname, 'preload.js'))
			}
		})

		// Let us register listeners on the window, so we can update the state
		// automatically (the listeners will be removed when the window is closed)
		// and restore the maximized or full screen state
		mainWindowState.manage(win)

		var openwinurl = pjson.config.wardenUniversalLoginUrl;//"https://auth.thinkingphones.com?accessToken=2.FEV--FcAJnKvcGB.YXBwbGljYXRpb246NlJzampuV0RpUjpOM0NKdlZtQ2lS&redirectUri=http%3A%2F%2Fws.thinkingphones.com";
		win.loadURL(openwinurl, {})

		win.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl, isMainFrame) {
console.log("Redirect URL::" + newUrl)
			if (newUrl.substring(0, 28) == "http://ws.thinkingphones.com") {

				universalLogin.replaceToken(newUrl, function (results) {
					mainWindow = createFconMainWindow(results);
				});

				win.close();
			}
		});

		return win
	}

	// MainWindow Section
	function createFconMainWindow (wardenData) {
		// Load the previous window state with fallback to defaults
		let mainWindowState = windowStateKeeper({
			defaultWidth: 440,  //420
			defaultHeight: 680 // 680
		})

		//'icon': path.join(__dirname, '/src/assets/img/icon.png'),
		//'titleBarStyle': 'hidden-inset',
		const fWin = new BrowserWindow({
			"transparent" : false,
			'width': 440,
			'height': 680,
			'resizable': false,
			'frame': true,
			'x': mainWindowState.x,
			'y': mainWindowState.y,
			'title': app.getName(),
			'icon': path.join(__dirname, '/src/app/images/Fuze-icon-purple-128.png'),
			'show': true, // Hide your application until your page has loaded
			'webPreferences': {
				'nodeIntegration': pjson.config.nodeIntegration || true, // Disabling node integration allows to use libraries such as jQuery/React, etc
				'preload': path.resolve(path.join(__dirname, 'preload.js'))
			}
		})

		fWin.wardenData = wardenData;

		// Let us register listeners on the window, so we can update the state
		// automatically (the listeners will be removed when the window is closed)
		// and restore the maximized or full screen state
		mainWindowState.manage(fWin)

		// Remove file:// if you need to load http URLs
		//win.loadURL(`file://${__dirname}/${pjson.config.initurl}`, {})
		//var openwinurl = "https://auth.thinkingphones.com?accessToken=2.FEV--FcAJnKvcGB.YXBwbGljYXRpb246NlJzampuV0RpUjpOM0NKdlZtQ2lS&redirectUri=http%3A%2F%2Fws.thinkingphones.com";
		//shell.openExternal(openwinurl)
		//win.loadURL(openwinurl, {})
		fWin.loadURL(`file://${__dirname}/${pjson.config.initurl}`, {})

		//var new_window = window.open('https://auth.thinkingphones.com?accessToken=2.M9G01Num4hZ08KQ.YXBwbGljYXRpb246dmh5NE5MMUU4UToyMU5VUk5Cd2NQ&redirectUri=https%3A%2F%2Fwblogin.gts.fuze.com');
		//new_window.focus();
		fWin.on('closed', onClosed)

		// Then, when everything is loaded, show the window and focus it so it pops up for the user
		// Yon can also use: win.webContents.on('did-finish-load')
		fWin.on('ready-to-show', () => {
			fWin.show()
			fWin.focus()
		})

		fWin.on('unresponsive', function () {
			// In the real world you should display a box and do something
			console.warn('The windows is not responding')
		})

		fWin.webContents.on('did-fail-load', (error, errorCode, errorDescription) => {
			var errorMessage

			if (errorCode === -105) {
				errorMessage = errorDescription || '[Connection Error] The host name could not be resolved, check your network connection'
				console.error(errorMessage)
			} else {
				errorMessage = errorDescription || 'Unknown error'
				console.error(errorMessage)
			}

			error.sender.loadURL(`file://${__dirname}/app/html/error.html`)

			fWin.webContents.on('did-finish-load', () => {
				fWin.webContents.send('app-error', errorMessage)
			})
		})

		fWin.webContents.on('crashed', () => {
			// In the real world you should display a box and do something
		console.error('The browser window has just crashed')
		})

		fWin.webContents.on('did-finish-load', () => {
			console.log("Finish load")
			fWin.webContents.send('contents-loaded', 'contents-loaded')
		})

		//

		return fWin
	}

	//Reset Settings
	function resetSettings(callback)
	{
		var settingsFilePath = settings.file();
		console.log('\n settingsFilePath : ' + settingsFilePath)
		try {
			fs.unlinkSync(settingsFilePath);
		} catch (err) {
			console.error("Failed to Remove the file " + settingsFilePath)
		}
		settings.clearPath();
		callback();
	}


	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('activate', () => {
		if (!loginWindow) {
			loginWindow = createLoginWindow()
		}
	})

	app.on('ready', () => {

		console.log("APP READY!!!!!!!!!!!!!!!")
		Menu.setApplicationMenu(createMenu())
		//var wardendata = localStorage.getItem('wardenData');


		isUserAuthenticated(function (res) {
			if (res == true)
			{
				console.log("User is authenticated!!!!")
				mainWindow = createFconMainWindow();
			}
			else
			{
				console.log("User is NOT authenticated!!!!")
				loginWindow  = createLoginWindow()
			}
		});


		//loginWindow = createLoginWindow()

		// Manage automatic updates
		try {
				require('./lib/auto-update/update')({
					url: (pjson.config.update) ? pjson.config.update.url || false : false,
					version: app.getVersion()
				})
				ipcMain.on('update-downloaded', (autoUpdater) => {
				// Elegant solution: display unobtrusive notification messages
					loginWindow.webContents.send('update-downloaded')
					ipcMain.on('update-and-restart', () => {
						autoUpdater.quitAndInstall()
					})

					// Basic solution: display a message box to the user
					// var updateNow = Dialog.showMessageBox(mainWindow, {
					//   type: 'question',
					//   buttons: ['Yes', 'No'],
					//   defaultId: 0,
					//   cancelId: 1,
					//   title: 'Update available',
					//   message: 'There is an update available, do you want to restart and install it now?'
					// })
					//
					// if (updateNow === 0) {
					//   autoUpdater.quitAndInstall()
					// }
				})
		} catch (e) {
			console.error(e.message)
			//Dialog.showErrorBox('Update Error', e.message)
		}
	})

	app.on('will-quit', () => {})


	//////////////////////////////////////////////////////////////////////////////////////
	// Main  Window ipcRender Events
	//////////////////////////////////////////////////////////////////////////////////////
	//MainWindow Menu Actions
	// reinitialize after data update
	ipcMain.on('re-initialize', (event, arg) => {
		mainWindow.loadURL(`file://${__dirname}/${arg}`, {})
	});
	// Reset Configuration
	ipcMain.on('reset-config', () => {
		//mainWindow.loadURL(`file://${__dirname}/${pjson.config.reseturl}`, {})
		resetSettings( function(){
			mainWindow.close();
			loginWindow  = createLoginWindow();
		});
	});

	//////////////////////////////////////////////////////////////////////////////////////
	// Password Window -- Password Prompt for End-Point Creation and _prompt
	//////////////////////////////////////////////////////////////////////////////////////
	ipcMain.on('set-crmType', () => {
		if (crmTypeWindow) {
			return
		}
		console.log("YEAH")
		crmTypeWindow = new BrowserWindow({
		"transparent" : false,
		'width': 440,
		'height': 320,
		'resizable': false,
		'frame': false
		})

		crmTypeWindow.loadURL(`file://${__dirname}/app/html/crmType.html`, {})

		crmTypeWindow.on('closed', () => {
			crmTypeWindow = null
		})
	});

	//MainWindow Events From HandleUserData
	//End Point is Valid -- This is checked after the Socket is Checked
	ipcMain.on('end-point-validated', (event, arg) => {
		mainWindow.loadURL(`file://${__dirname}/${arg}`, {})
	});

	//Invalid Socket
	ipcMain.on('socket-invalid-auth', (event, arg) => {
		mainWindow.loadURL(`file://${__dirname}/${arg}`, {})
	});

	//Complete User Data
	ipcMain.on('complete-user-data', (event, arg) => {
		mainWindow.loadURL(`file://${__dirname}/${arg}`, {})
	});

	//Prompt For User Name
	//ipcMain.on('prompt-for-user-name', (event, arg) => {
	//	//ipcRenderer.send('setup-window', 'setup');
	//	//ipcRenderer.send('open-prompt-for-user-name', arg);
	//	//mainWindow.loadURL(`file://${__dirname}/${arg}`, {})
	//});

	//No Settings Available Show Login
	ipcMain.on('show-login-window', (event, arg) => {
		//mainWindow.loadURL(`file://${__dirname}/${arg}`, {});
		mainWindow.close();
		loginWindow  = createLoginWindow();

		eventBus.emit('show-login-window', arg);
	});

	//User Not Active
	ipcMain.on('user-not-active', (event, arg) => {
		//mainWindow.loadURL(`file://${__dirname}/${arg}`, {});
		mainWindow.close();
		loginWindow  = createLoginWindow();
	});

	//No Matching User
	ipcMain.on('no-matching-user', (event, arg) => {
		//mainWindow.loadURL(`file://${__dirname}/${arg}`, {});
		mainWindow.close();
		loginWindow  = createLoginWindow();
	});

	//No Matching User
	ipcMain.on('too-many-matching-user', (event, arg) => {
		console.error("Too Many Matching User");
		mainWindow.close();
		loginWindow  = createLoginWindow();
	});

	//Cannot Create User Settings
	ipcMain.on('cannot-create-user-settings', (event, arg) => {
		console.error("Cannot Create User Settings");
	});

	//////////////////////////////////////////////////////////////////////////////////////
	// Info Window
	//////////////////////////////////////////////////////////////////////////////////////
	// Info Window
	ipcMain.on('open-info-window', () => {
		if (infoWindow) {
			return
		}
		infoWindow = new BrowserWindow({
			'width': 320,
			'height': 420,
			'resizable': false
		})

		infoWindow.loadURL(`file://${__dirname}/${pjson.config.infourl}`)

		infoWindow.on('closed', () => {
			infoWindow = null
		})
	})

	//////////////////////////////////////////////////////////////////////////////////////
	// Utility Window -- Call Notes and the like
	//////////////////////////////////////////////////////////////////////////////////////
	ipcMain.on('open-utility-window', (event, arg) => {
		console.log("Args == " + JSON.stringify(arg));
		if (utilWindow) {
			return
		}

		utilWindow = new BrowserWindow({
			"transparent" : false,
			'width': 450,
			'height': 425,
			'resizable': false,
			'frame': true
		})


		utilWindow.loadURL(`file://${__dirname}/${arg.pageUrl}`, {})

		utilWindow.webContents.on('did-finish-load', () => {
			utilWindow.webContents.send('utility-loaded', arg.callerName)
		})

		utilWindow.on('closed', () => {
			utilWindow = null
		})
		utilWindow.webContents.on('utility-close', () => {
			utilWindow = null
		});
	});

	//////////////////////////////////////////////////////////////////////////////////////
	// Password Window -- Password Prompt for End-Point Creation and _prompt
	//////////////////////////////////////////////////////////////////////////////////////
	ipcMain.on('open-password-window', (event, arg) => {
		if (passWindow) {
			return
		}

		passWindow = new BrowserWindow({
			"transparent" : false,
			'width': 440,
			'height': 320,
			'resizable': false,
			'frame': false
		})

		passWindow.loadURL(`file://${__dirname}/${arg}`, {})

		passWindow.on('closed', () => {
			passWindow = null
		})
	});

	//////////////////////////////////////////////////////////////////////////////////////
	// Password Window -- Password Prompt for End-Point Creation and _prompt
	//////////////////////////////////////////////////////////////////////////////////////
	ipcMain.on('prompt-for-user-name', (event, arg) => {
		console.log("Args == " + JSON.stringify(arg));
		if (passWindow) {
			return
		}

		passWindow = new BrowserWindow({
			"transparent" : false,
			'width': 440,
			'height': 400,
			'resizable': false,
			'frame': false
		})

		passWindow.loadURL(`file://${__dirname}/${arg}`, {})

		passWindow.on('closed', () => {
			passWindow = null
		})
	});


}


// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
	return app.makeSingleInstance(() => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore()
				mainWindow.focus()
		}
	})
}

function createMenu () {
	return Menu.buildFromTemplate(require('./lib/menu'))
}

// Manage Squirrel startup event (Windows)
require('./lib/auto-update/startup')(initialize)
