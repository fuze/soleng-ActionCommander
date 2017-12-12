'use strict'

const lc = require('../js/localConfigSettings');
//const snowAuth 	= require('../js/oauth/buildServiceNowInstance');
//const msdAuth 	= require('../js/oauth/buildMSDInstance');
//const zohoAuth 	= require('../js/oauth/buildZoHoInstance');
const authPasswdC 	= require('../js/oauth/authPasswdController');

var _username; // = bg.getWrapUpCode();
var _password; // = getCallNotes();
var _whichend;

var passwd_div		= document.getElementById('password-div');
var passwd_title	= document.getElementById('password-title');
var passwd_name		= document.getElementById('password-name');
var password		= document.getElementById('password-value')
var save 			= document.getElementById('save');

console.log("cnt.passwdAuth.js");

//////////////////////////////////////////////////////////////////////////
window.onload = function () {
	_whichend = getEndPointType(lc.getCEType(), lc.getPrompt());
	if (lc.getCrmUser()) {
		_username = lc.getCrmUser();
	} else { 
		_username = lc.getPrompt();
	}
	console.log("cmf.passwdAuth.js  _whichend == " + _whichend);
	console.log("cmf.passwdAuth.js  getCrmUser == " + lc.getCrmUser());
	console.log("cmf.passwdAuth.js  getPrompt == " + lc.getPrompt());
	setInitialState();
};
//////////////////////////////////////////////////////////////////////////
function setInitialState() {
	passwd_title.innerHTML = _whichend + ' Password for :';
	passwd_name.innerHTML = _username;
}
//////////////////////////////////////////////////////////////////////////
function getEndPointType (type, prompt) {
	if (prompt !== null) {
		return 'VTiger';
	} else {
		switch (type) {
    	case 'dynamicscrmadfs' :
    		return 'MS Dynamics';
    		break;
    	case 'zohocrm' :
    		return 'ZoHo';
    		break;
    	case 'servicenow' :
    		return 'ServiceNow';
    		break;
		case 'netsuitecrmv2' :
			return 'Netsuite';
			break;
    	default :
    		return 'Unknown Connector';
    		break;
    	}
    }
}
//////////////////////////////////////////////////////////////////////////
save.onclick = function() {
	console.log("Save Button " + password.value);
	if (!password.value) {
		if(confirm('No Password Enterend')) {
			password.value = 'NULL';
		}
	}
	
	authPasswdC.authPasswdController(_username, password.value);

}
