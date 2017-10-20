'use strict'

const { remote, ipcRenderer } = require('electron');
const pjson = remote.getGlobal('pjson');

const lc = require('../localConfigSettings');

const updateUserDataUrl = pjson.config.updateUserDataUrl;
const updateTempKeys	= pjson.config.updateTempKeys;


function oauthUserUpdate() {};

////////////////////////////////////////////////////////////////////////////////////////
oauthUserUpdate.prototype.updateUserData = function(id, token, state, callback) {
	
	var userUrl = updateUserDataUrl + encodeURIComponent(lc.getUsername()) + '&ce_element_id=Element ';
		userUrl += encodeURIComponent(token);
	
	var xhr = new XMLHttpRequest();
	xhr.open('PUT', userUrl);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("updateUserData: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\nupdateUserData: == " + JSON.stringify(resp));
				console.warn("Username == " + lc.getUsername() + " Password " + lc.getPassword());
				ipcRenderer.send('re-initialize', pjson.config.initurl);
				//____.getUserData(lc.getUsername(), lc.getPassword());
				if (state) {
					updateTmpKeyData(state);
				}
				if (callback) {
					callback();
				}
			} else {
				console.log("updateUserData: xhr.responseText == " + xhr.responseText)
				console.log("updateUserData: xhr.status == " + xhr.status)
				//alert ("Bad Call")
			}
		}
	};
	xhr.send();
	
}
////////////////////////////////////////////////////////////////////////////////////////
function updateTmpKeyData(state) {
	var tokenUrl = updateTempKeys + state;
	
	var xhr = new XMLHttpRequest();
	xhr.open('PUT', tokenUrl);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("updateTmpKeyData: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\nupdateTmpKeyData: == " + JSON.stringify(resp));
			} else {
				console.log("updateTmpKeyData: xhr.responseText == " + xhr.responseText)
				console.log("updateTmpKeyData: xhr.status == " + xhr.status)
				//alert ("Bad Call")
			}
		}
	};
	xhr.send();
}

module.exports = new oauthUserUpdate();
