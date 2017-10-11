'use strict'

const { remote } = require('electron');
const { ipcRenderer } = require('electron');
const mainWindow = remote.getGlobal('mainWindow')
const app = remote.app;

const Bus = require('electron-eventbus');
const eventBus = new Bus();
const pjson = remote.getGlobal('pjson')
//const userhandler = require('../js/handleUserData');
const connect = require('../js/checkConnections');

const settings = require('../js/usersettings');

window.onload = function () {
	console.debug("bg.getUserData in window.onload ");
	const username		= document.getElementById('crm-username');
	const userspan 		= document.getElementById('span-crm-username');
	const save 			= document.getElementById('save');
	userspan.textContent =  'Not Set';
	
    
	//  Here is the Meat!
	save.onclick = function login() {
		console.debug("save button clicked user == " + username.value);
		console.debug("save button clicked user == " + username.value.length);
		
		
		if (username.value.length <= 0 )  {
			console.debug("incomplete data");
			userspan.textContent =  'Check User Name';	
		} else {
			console.debug("Do the UserData Update");
			settings.addPromptedUsername(username.value, function(json, event) {
				console.debug('userPrompt:  ' + JSON.stringify(json, null, 2))
				console.debug('userPrompt:  <' + username.value + '>');
				const userhandler = require('../js/handleUserData');
				connect.checkConnectivity(json, function(obj) {
					console.debug('userPrompt:  ' + JSON.stringify(obj, null, 2))
						if (obj.code == 200) { 					
							ipcRenderer.send('complete-user-data', pjson.config.mainurl, function() {
								console.debug('userPrompt:  Why are we here? ' + JSON.stringify(obj, null, 2))
								var thisWindow = remote.getCurrentWindow();
    							thisWindow.close();
    						});
						} else {
							
							var buttons = [ 'Exit', 'Continue'];

							remote.dialog.showMessageBox(mainWindow, { 
								type: 'error', 
								buttons: buttons, 
								message: "Error " + obj.code + "\n\n" + obj.message + "\nPlease Contact Support\n"
							},  function(buttonIndex) {
								exitOrContinue(buttonIndex, function() {
									ipcRenderer.send(json.event, pjson.config.crmuserprompt); 
								});
							});
						}
						
    			});
			});

		}
	}

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

