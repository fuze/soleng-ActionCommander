'use strict'

const lc = require('../js/localConfigSettings');
//const snowAuth 	= require('../js/oauth/buildServiceNowInstance');
//const msdAuth 	= require('../js/oauth/buildMSDInstance');
//const zohoAuth 	= require('../js/oauth/buildZoHoInstance');
const authPasswdC 	= require('../js/oauth/authPasswdController');
const remote 		= require('electron').remote;
const settings 		= require('../js/usersettings');

var _username; // = bg.getWrapUpCode();
var _password; // = getCallNotes();
var _whichend;

var crmType_div		= document.getElementById('crmType-div');
var crmType_title	= document.getElementById('crmType-title');
var crmType_name		= document.getElementById('crmType-name');
var crmType		= document.getElementById('crmType-value')
var save 			= document.getElementById('save');

console.log("cnt.setCrmType.js");

//////////////////////////////////////////////////////////////////////////
window.onload = function () {

	setInitialState();
};
//////////////////////////////////////////////////////////////////////////
function setInitialState() {
	crmType_title.innerHTML = ' Custom type:';
	crmType.value = localStorage.getItem('crmType');
}

//////////////////////////////////////////////////////////////////////////
save.onclick = function() {
	console.log("Save Button " + crmType.value);
	if (!crmType.value) {
		if(confirm('No Type Enterend')) {
			crmType.value = 'NULL';
		}
	}
	
	//authPasswdC.authPasswdController(_username, password.value);
	//TODO: Store custom type
	//loginWindow.crmType = crmType.value;
	localStorage.setItem('crmType', crmType.value);

	var thisWindow = remote.getCurrentWindow();
	thisWindow.close();
}
