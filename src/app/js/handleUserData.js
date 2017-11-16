'use strict'

const { ipcRenderer } = require('electron');
const remote = require('electron').remote;
const mainWindow = remote.getGlobal('mainWindow')
const pjson = remote.getGlobal('pjson')
const app = remote.app;
const connect = require('../js/checkConnections');
const authCntr = require('../js/oauth/authController');

const Bus = require('electron-eventbus');
const eventBus = new Bus();

function userHandler() {};
//////////////////////////////////////////////////////////////////////////////////////////
// getUserSettings
 userHandler.prototype.userDataHandler = function (json, callback) {

	console.warn("userHandler: Object == " + JSON.stringify(json, null, 2));
	console.warn("userHandler: code == " + json.code);
	switch(json.code) {
    	case 200 : // Event 1000 - Complete User Data *
    		connect.checkConnectivity(json, function(obj) {
				console.warn("userHandler: callback code == " + JSON.stringify(obj));
        		eventBus.emit(json.action, json);		
			});
			break;
        case 202 : // Event 1001 - Prompt For User Name *
        	eventBus.emit(json.action, json);
        	break;
        case 204 : // Event 1002 - No Settings Available Show Login *
        	eventBus.emit(json.action, json);
        	break;
		case 206 : // Event 1003 - No End Point Defined
			console.warn("userHandler: EVENT 206 == " + JSON.stringify(json, null, 2));
			connect.checkConnectivity(json, function(obj) {
				console.warn("userHandler: callback code == " + JSON.stringify(obj));
        		eventBus.emit(json.action, json);		
			});
			break;
        case 403: // Event 1004 - User Not Active
    	case 404: // Event 1005 - No Matching User
       	case 409: // Event 1006 - Too Many Matching User
       		eventBus.emit(json.action, json);			
        	break;
        case 500: // Event 1007 - Cannot Create User Settings
        	eventBus.emit(json.action, json);
        	break;	
    	default:
    		remote.dialog.showErrorBox('Error XXX', json.action + " " + json.message +  'Unexpected Error Message' + "\nPlease Contact Support");
        	break;
    }
	callback(json);
}
//------------------------------------------------------------------------------------
// Call Back Function to Continue or Exit
function exitOrContinue(buttonIndex, callback) {
	if( buttonIndex == 0) {
		console.log("Exit: " + buttonIndex);
		app.quit();
	} else  {
		callback();
	}
}
//------------------------------------------------------------------------------------
// Call Back Function to Reset and Try Again or Quit Application
function resetOrExit(buttonIndex, event, url) {
	if( buttonIndex == 0) {
		console.log("Exit: " + buttonIndex);
		app.quit();
	} else  {
		ipcRenderer.send(event, url);
	}
}
//------------------------------------------------------------------------------------
// Call Back Function to  Quit Application
function exitApp(buttonIndex) {
		app.quit();
}

//////////////////////////////////////////////////////////////////////////////////////////
// User Settings Evetns
//////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------------
// Complete User Data Code 200 (tested)
//"action" : 1000, "event" : "complete-user-data", "message" : "complete-user-Data", "Complete User Data"
eventBus.on('1000', function(json, code, action, event, message) {
	console.warn("Event 1000");
	ipcRenderer.send(json.event, pjson.config.mainurl); 
});

//------------------------------------------------------------------------------------
// Prompt For User Name Code 202 (tested)
//"action" : 1001, "event" : "prompt-for-user-name",  "message" : "Prompt For User Name" 
eventBus.on('1001', function(json, code, action, event, message) {
	console.warn("Event 1001");
	ipcRenderer.send(json.event, pjson.config.crmuserprompt); 
});

//------------------------------------------------------------------------------------
// No User Data Code 204 (tested)
//"action" : 1002, "event" : "show-login-window",  "message" : "No Settings Available Show Login"
eventBus.on('1002', function(json, code, action, event, message) {
	console.warn("Event 1002");
	ipcRenderer.send(json.event, pjson.config.loginurl);
});

//------------------------------------------------------------------------------------
// No End Point Defined Error Code 206 (tested)
//"action" : 1003, "event" : "no-end-point-defined"",  "message" : "No End Point Defined"
eventBus.on('1003', function(json, code, action, event, message) {
	var buttons = [ 'Exit', 'Continue'];

	remote.dialog.showMessageBox(mainWindow, {
			type: 'error', 
			buttons: buttons, 
			message: json.message + "\nDo you want to create a new one?\n"
		},  function(buttonIndex) {
			exitOrContinue(buttonIndex, function() {
				authCntr.authController();
			});
	});

});

//------------------------------------------------------------------------------------
// User Not Active Error Code 401 (tested)
//"action" : 1004, "event" : "user-not-active",  "message" : "User Not Active"
eventBus.on('1004', function(json, code, action, event, message) {
	
	var buttons = [ 'Exit', 'Reset'];

	remote.dialog.showMessageBox(mainWindow, { 
			type: 'error', 
			buttons: buttons, 
			message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n"
		},  function(buttonIndex) {
			resetOrExit(buttonIndex, json.event, pjson.config.loginurl);
	});

});

//------------------------------------------------------------------------------------
// User Not Found Error Code 404 (tested)
//"action" : 1005, "event" : "no-matching-user",  "message" : "No Matching User"
eventBus.on('1005', function(json, code, action, event, message) {
	var buttons = [ 'Exit', 'Reset'];
	
	remote.dialog.showMessageBox(mainWindow, { 
			type: 'error', 
			buttons: buttons, 
			message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n"
		},  function(buttonIndex) {
			resetOrExit(buttonIndex, json.event, pjson.config.loginurl);
	});
});


//------------------------------------------------------------------------------------
// User Not Found Error Code 409
//"action" : 1006, "event" : "too-many-matching-user",  "message" : "Too Many Matching User"
eventBus.on('1006', function(json, code, action, event, message) {
	var buttons = [ 'Exit'];
	remote.dialog.showMessageBox(mainWindow, { 
			type: 'error', 
			buttons: buttons, 
			message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n"
		},  function(buttonIndex) {
			exitApp(buttonIndex);
	});
		
});

//------------------------------------------------------------------------------------
// Main Window Events
//"action" : 1007, "event" : "cannot-create-user-settings",  "message" : "Cannot Create User Settings"
eventBus.on('1007', function(json, code, action, event, message) {
	var buttons = [ 'Exit'];
	remote.dialog.showMessageBox(mainWindow, { 
		type: 'error', 
		buttons: [ 'Exit'], 
		message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n\nExit?"
	}, function(buttonIndex) {
		exitApp(buttonIndex);
	});		
	
});

//////////////////////////////////////////////////////////////////////////////////////////
// Socket Events
//////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------------
// Fuze Socket Start Success
//"code" : 200, "action" : 2000, "event" : "socket-started",  "message" : "Active Listener"
eventBus.on('2000', function(json, code, action, event, message) {
	console.warn("Event 2000 " + JSON.stringify(arguments));
});
//------------------------------------------------------------------------------------
// Fuze Socket Stop Success
//"code" : 200, "action" : 2001, "event" : "socket-stopped",  "message" : "Socket Stopped"
eventBus.on('2001', function(json, code, action, event, message) {
	console.warn("Event 2000 " + JSON.stringify(arguments));
});
//------------------------------------------------------------------------------------
// Fuze Socket Auth Error
//"code" : 401, "action" : 2002, "event" : "socket-invalid-auth",  "message" : "Username and/or password are incorrect"
eventBus.on('2002', function(json, code, action, event, message) {

	var buttons = [ 'Exit', 'Reset'];
	remote.dialog.showMessageBox(mainWindow, { 
		type: 'error', 
		buttons: buttons, 
		message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n\nExit?"
	}, function(buttonIndex) {
		resetOrExit(buttonIndex, json.event, pjson.config.loginurl);
	});
});
//------------------------------------------------------------------------------------
// Fuze Socket Not Listening -- Too Many Connections
//"code" : 500, "action" : 2003, "event" : "not-a-listening-browser",  "message" : "This is not a listening browser window"
eventBus.on('2001', function(json, code, action, event, message) {
	console.warn("Event 2000 " + JSON.stringify(arguments));
	var buttons = [ 'Exit', 'Reset'];
	remote.dialog.showMessageBox(mainWindow, { 
		type: 'error', 
		buttons: buttons, 
		message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n\nExit?"
	})
	
});

//////////////////////////////////////////////////////////////////////////////////////////
// Validate EndPoint Events
//////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------------
// end-point-validated 
//"code" : 200, "action" : 3000, "event" : "end-point-validated",  "message" : "End Point Validated"
eventBus.on('3000', function(json, code, action, event, message) {
	console.log.apply(console, arguments);
	console.warn("Event 3000 " + JSON.stringify(arguments));
	ipcRenderer.send(json.event, pjson.config.mainurl);
	
});
//------------------------------------------------------------------------------------
// end-point-invalid 
//code" : 401, "action" : 3001, "event" : "end-point-invalid",  "message" : "End Not Point Validated"
eventBus.on('3001', function(json, code, action, event, message) {
	console.warn("Event 3001");
	
	var buttons = [ 'Exit', 'Reset'];
	remote.dialog.showMessageBox(mainWindow, { 
		type: 'error', 
		buttons: buttons, 
		message: "Error " + json.code + "\n\n" + json.message + "\nPlease Contact Support\n\nExit?"
	}, function(buttonIndex) {
		resetOrExit(buttonIndex, json.event, pjson.config.loginurl);
	});
	
});
module.exports = new userHandler();
