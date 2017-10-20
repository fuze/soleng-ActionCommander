'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildZoHoInstance = function(user, password, callback) {
	
	var url = cloudElementsApiUrl +'instances';
	
	
	console.log("buildZoHoInstance: User == " + user);
	console.log("buildZoHoInstance: Password == " + password);
	var postData = '{ "element" : { "key" : "zohocrm" }, ';
		postData += '"configuration": { ';
    	postData += '"crm.zohocrm.username":"' + user + '",  ';
    	postData += '"crm.zohocrm.password":"'+ password + '" }, ';
  		postData += '"tags": ["' + lc.getFullname() + ' - ' + lc.getConnectorName() + '"], ';
  		postData += '"name": "'+ lc.getConnectorName() + '"}';
	
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	//var header = _Settings.fuzeUserToken + ', ' +  _Settings.fuzeOrgToken;    
	console.log("buildZoHoInstance header == " + header);
	console.log("buildZoHoInstance postData == " + postData);
	console.log("buildZoHoInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildZoHoInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\n\buildZoHoInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\n\buildZoHoInstance: ID == " + resp.id);
				console.log("\n\n\n\buildZoHoInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, null, callback);
			} else if ( xhr.status == 401 ) {
				alert("Please Check UserName and Password");
				//callback();
				authCnt.authController();
			} else {
				//alert("General Error\n" + xhr.responseText);
				console.log("buildZoHoInstance: xhr.responseText == " + xhr.responseText);
				console.log("buildZoHoInstance: xhr.status == " + xhr.status);
				callback();
			}
		}
	};
	xhr.send(postData);

}
