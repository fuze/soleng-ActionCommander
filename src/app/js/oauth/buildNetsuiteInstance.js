'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildNetsuiteInstance = function(user, password, callback) {
	
	var url = cloudElementsApiUrl +'instances';
	
	
	console.log("buildNetsuiteInstance: User == " + user);
	console.log("buildNetsuiteInstance: Password == " + password);

	var postData = '{ "element" : { "key" : "netsuitecrmv2" }, ';
		postData +=  '"configuration": { ';
		postData += 	'"netsuite.accountId":"' + lc.getCrmAdminUser() + '", ';
		postData += 	'"authentication.type":"Basic", ';
		postData += 	'"user.username":"'+ user + '", ';
		postData += 	'"user.password":"'+ password + '", ';
		postData += 	'"netsuite.appId":"' + lc.getCrmAdminPasswd() + '", ';
		postData += 	'"event.notification.enabled":false }, ';
		postData +=  '"tags": ["' + lc.getFullname() + ' - ' + lc.getConnectorName() + '"], ';
		postData +=  '"name": "'+ lc.getConnectorName() + '"}';
	
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	//var header = _Settings.fuzeUserToken + ', ' +  _Settings.fuzeOrgToken;    
	console.log("buildNetsuiteInstance header == " + header);
	console.log("buildNetsuiteInstance postData == " + postData);
	console.log("buildNetsuiteInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildNetsuiteInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\n\buildNetsuiteInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\n\buildNetsuiteInstance: ID == " + resp.id);
				console.log("\n\n\n\buildNetsuiteInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, null, callback);
			} else if ( xhr.status == 401 ) {
				alert("Please Check UserName and Password");
				//callback();
				authCnt.authController();
			} else {
				//alert("General Error\n" + xhr.responseText);
				console.log("buildNetsuiteInstance: xhr.responseText == " + xhr.responseText);
				console.log("buildNetsuiteInstance: xhr.status == " + xhr.status);
				callback();
			}
		}
	};
	xhr.send(postData);

}
