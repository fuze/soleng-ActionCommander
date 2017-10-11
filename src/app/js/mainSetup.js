'use strict'

const { remote } = require('electron');
//const { ipcRenderer } = require('electron');

const settings = require('../js/usersettings');
const userhandler = require('../js/handleUserData');

//SetUP
const setupdiv			= document.getElementById('setup-mainsetup');
const setupline1		= document.getElementById('setup-mainsetup-l1');
const setupline2		= document.getElementById('setup-mainsetup-l2');
const setuptag			= document.getElementById('setup-username-tag');
const setupusername		= document.getElementById('setup-username');
const setuppassword 	= document.getElementById('setup-password');
const setupuserspan		= document.getElementById('span-setup-username');
const setuppwtag		= document.getElementById('setup-password-tag');
const setuppasswdspan 	= document.getElementById('span-setup-password');
const setupsave 		= document.getElementById('save');
const setupreset 		= document.getElementById('reset');
// Status
const mainstatus 		= document.getElementById('mainstatus');
const statustable 		= document.getElementById('statustable');
const socketstatus 		= document.getElementById('socket-status');
const crmstatus 		= document.getElementById('crm-status');
// Reset 
const mainreset			= document.getElementById('mainreset-div');
const reset				= document.getElementById('reset');
const resetmsg			= document.getElementById('reset-msg');
const resetclosemsg1	= document.getElementById('reset-closemsg1');	
const resetclosemsg2	= document.getElementById('reset-closemsg2');
const resetclosemsg3	= document.getElementById('reset-closemsg3');	
const resetclosemsg4	= document.getElementById('reset-closemsg4');
const resetclosemsg5	= document.getElementById('reset-closemsg5');

// CRM userhandler
const crmusernamediv 	= document.getElementById('crmusername-div');
const crmusernamel1		= document.getElementById('crmusername-l1');
const crmusernamel2		= document.getElementById('crmusername-l2');
const crmusernametag	= document.getElementById('crmusername-tag');
const crmusernameinput	= document.getElementById('crmusername-input');
const crmusernamespan 	= document.getElementById('crmusername-span');
const crmusernamebtn 	= document.getElementById('crmusername-btn');
const crmusernamebtnv	= document.getElementById('crmusername-btnv');


//---------------------------------------------------------------------------------------
window.onload = function () {
	changeSetupVisibility("on"); //inline
	changeCrmVisibility("none");
	//changeUandPVisibility("none");
	
	console.debug("mainSetup in window.onload ");
	setupuserspan.textContent =  'Not Set';
	setuppasswdspan.textContent = 'Not Set';
	updateSaveButtonState()
	
	setupusername.onchange = function() {
		setupusername.classList.add('changed');
		updateSaveButtonState();
	}
	
	setuppassword.onchange = function() {
		setuppassword.classList.add('changed');
		updateSaveButtonState();
	};

	//updateSaveButtonState
	function updateSaveButtonState() {
    	// Disable Save if the fields are not changed and/or invalid
    	setupsave.disabled = !document.querySelector('.changed:not(.invalid)');
    }
    
	// On Reset
	reset.onclick = function reset() {
		console.debug("reset button clicked ");
	}
	
	// On Save of Main UserName/Password
	setupsave.onclick = function login() {
		console.debug("save button clicked user == " + setupusername.value + " '" + setuppassword.value + "'");
		console.debug("save button clicked user == " + setuppassword.value.length + " '" + setuppassword.value.length + "'");
		
		
		if ((setupusername.value.length <= 0 ) && (setuppassword.value.length <= 0)) {
			console.debug("incomplete data");
			setupuserspan.textContent =  'Check User Name';
			setuppasswdspan.textContent = 'Check Password';	
		} else {
			console.debug("Do the Login");
			settings.createUserSettings(setupusername.value, setuppassword.value, function(json) {
				console.debug("background: Action == "+ json.action + " event " + json.event + " message " + json.message);
				console.debug('initializeData:  ' + JSON.stringify(json, null, 2))
				userhandler.userDataHandler(json, function(obj) {
					console.warn("mainSetup UserHadner" + obj);
				});	
				//if (obj.action == 1005) {
				//	background.initialzeBackground();
				//}
			});
		}
	}

	/*
	// On Save of CRM UserName
	crmusername.onclick = function login() {
		console.debug("save button clicked user == " + username.value + " '" + password.value + "'");
		console.debug("save button clicked user == " + username.value.length + " '" + password.value.length + "'");
		
		
		if ((username.value.length <= 0 ) && (password.value.length <= 0)) {
			console.debug("incomplete data");
			userspan.textContent =  'Check User Name';
			passwdspan.textContent = 'Check Password';	
		} else {
			console.debug("Do the Login");
			settings.createUserSettings(username.value, password.value, function(json) {
				console.debug("background: Action == "+ json.action + " event " + json.event + " message " + json.message);
				console.debug('initializeData:  ' + JSON.stringify(json, null, 2))
				userhandler.userDataHandler(json, function(obj) {
					console.warn("mainSetup UserHadner" + obj);
				});	
				//if (obj.action == 1005) {
				//	background.initialzeBackground();
				//}
			});
		}
	}
	// On Save of CRM UserName/Password
	username.onclick = function login() {
		console.debug("save button clicked user == " + username.value + " '" + password.value + "'");
		console.debug("save button clicked user == " + username.value.length + " '" + password.value.length + "'");
		
		
		if ((username.value.length <= 0 ) && (password.value.length <= 0)) {
			console.debug("incomplete data");
			userspan.textContent =  'Check User Name';
			passwdspan.textContent = 'Check Password';	
		} else {
			console.debug("Do the Login");
			settings.createUserSettings(username.value, password.value, function(json) {
				console.debug("background: Action == "+ json.action + " event " + json.event + " message " + json.message);
				console.debug('initializeData:  ' + JSON.stringify(json, null, 2))
				userhandler.userDataHandler(json, function(obj) {
					console.warn("mainSetup UserHadner" + obj);
				});	
			});
		}
	}
	*/

}


//---------------------------------------------------------------------------------------
function changeCrmVisibility(visible) {
	if ( visible == 'on') {
			visible = "ON";
	} else {
			visible = "none";
	}
	crmusernamediv.style.display 			= visible;
	crmusernamel1.style.display 			= visible;
	crmusernamel2.style.display 			= visible;
	crmusernametag.style.display 			= visible;
	crmusernameinput.style.display 			= visible;
	crmusernamespan.style.display 			= visible;
	crmusernamebtn.style.display 			= visible;
	crmusernamebtnv.style.display 			= visible;
}


//---------------------------------------------------------------------------------------
function changeSetupVisibility(visible) {
	if ( visible == 'on') {
			visible = "ON";
	} else {
			visible = "none";
	}

	setupdiv.style.display 			= visible;
	setupline1.style.display 		= visible;
	setupline2.style.display 		= visible;
	setuptag.style.display 			= visible;
	setupusername.style.display 	= visible;
	setuppassword.style.display 	= visible;
	setupuserspan.style.display 	= visible;
	setuppwtag.style.display 		= visible;
	setuppasswdspan.style.display 	= visible;
	setupsave.style.display 		= visible;
	setupreset.style.display 		= visible;
	// Status
	mainstatus.style.display 		= visible;
	statustable.style.display 		= visible;
	socketstatus.style.display 		= visible;
	crmstatus.style.display 		= visible;
	// Reset
	mainreset.style.display 		= visible;
	reset.style.display 			= visible;
	resetmsg.style.display 			= visible;
	resetclosemsg1.style.display 	= visible;
	resetclosemsg2.style.display 	= visible;
	resetclosemsg3.style.display 	= "in";
	resetclosemsg4.style.display 	= "in";
	resetclosemsg5.style.display 	= "in";
}


