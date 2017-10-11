'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildSFDCInstance = function(results, responce, state) {
	console.log("buildSFDCInstance  results== " + JSON.stringify(results));
	console.log("buildSFDCInstance  responce== " + JSON.stringify(responce));
	console.log("buildSFDCInstance  state == " + state);
	
	var url = cloudElementsApiUrl + 'instances';
	
	var postData = '{ "element" : { "key" : "' + results.element + '" }, ';
 		postData += '"configuration" : { "base.url" : "' + lc.getCrmBaseUrl() + '", ';
 		//postData += '"configuration" : { "base.url" : "' + siteaddress + '", ';
		postData += '"oauth.api.key" : "'+ lc.getCEKey() +'" , ';
		postData += '"oauth.api.secret" : "'+ lc.getCESecret() +'" }, ';
		postData += '"providerData" : { "code" : "' + responce[0].code + '" }, ';
		postData += '"oauthProxy" : { "isOauthProxy" : "true" , ';
		postData += '"oauthProxyName" : "'+ lc.getCEProxy() +'" }, ';
		postData += '"tags" : [ "' + lc.getFullname() + ' - ' + lc.getConnectorName() + '-INSTALL-TEST" ], ';
		postData += '"name" : "'+ lc.getConnectorName() + '" }';
		
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	console.log("buildSFDCInstance header == " + header);
	console.log("buildSFDCInstance postData == " + postData);
	console.log("buildSFDCInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildSFDCInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\nbuildSFDCInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\nbuildSFDCInstance: ID == " + resp.id);
				console.log("\n\n\nbuildSFDCInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, state);
				
			} else {
				console.log("buildSFDCInstance: xhr.responseText == " + xhr.responseText)
				console.log("buildSFDCInstance: xhr.status == " + xhr.status)
				alert ("Bad Call")
			}
		}
	};
	xhr.send(postData);
}


