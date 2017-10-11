'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');
const authCnt = require('./authController');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildMSDInstance = function(user, password, callback) {
	
	var url = cloudElementsApiUrl +'instances';
	var domain = lc.getCrmBaseUrl().replace(/.*?:\/\//g, "");
console.warn("Please Check UserName and Password " + domain);
	console.log("buildMSDInstance: User == " + user);
	console.log("buildMSDInstance: Password ==  " + domain);
	var postData = '{ "element" : { "key" : "dynamicscrmadfs" }, ';
		postData += '"configuration": { ';
		postData += '"authentication.type": "custom",' ;
    	postData += '"user.username":"' + user + '",  ';
    	postData += '"user.password":"'+ password + '", ';
    	postData += '"dynamics.tenant":"' + domain +'" }, ';
  		postData += '"tags": ["' + lc.getFullname() + ' - ' + lc.getConnectorName() + '-INSTALL-TEST"], ';
  		postData += '"name": "'+ lc.getConnectorName() + '"}';
	
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	//var header = _Settings.fuzeUserToken + ', ' +  _Settings.fuzeOrgToken;    
	console.log("buildMSDInstance header == " + header);
	console.log("buildMSDInstance postData == " + postData);
	console.log("buildMSDInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildMSDInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\nbuildMSDInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\nbuildMSDInstance: ID == " + resp.id);
				console.log("\n\n\nbuildMSDInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, null);
				callback();
			} else if ( xhr.status == 401 ) {
				console.error("Please Check UserName and Password");
				authCnt.authController(); 
				callback();
			} else {
				console.error("General Error\n" + xhr.responseText);
				console.error("buildMSDInstance: xhr.responseText == " + xhr.responseText);
				console.error("buildMSDInstancee: xhr.status == " + xhr.status);
			}
		}
	};
	xhr.send(postData);

}
