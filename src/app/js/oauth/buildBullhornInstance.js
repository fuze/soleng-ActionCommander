'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildBullhornInstance = function(results, responce, state) {
	console.log("buildBullhornInstance  results== " + JSON.stringify(results));
	console.log("buildBullhornInstance  responce== " + JSON.stringify(responce));
	console.log("buildBullhornInstance  state == " + state);
	
	var url = 'https://console.cloud-elements.com/elements/api-v2/elements/1702/instances';
	
	var postData = '{ "element" : { "key" : "' + results.element + '" }, ';
 		postData += '"configuration" : { ';
 		//postData += '"configuration" : { "base.url" : "' + siteaddress + '", ';
		postData += '"oauth.api.key" : "'+ lc.getCEKey() +'" , ';
		postData += '"oauth.api.secret" : "'+ lc.getCESecret() +'" , ';
		postData += '"oauth.callback.url" : "'+ lc.getCEOauthUrl() +'" }, ';
		postData += '"providerData" : { "code" : "' + responce[0].code + '" }, ';
		postData += '"oauthProxy" : { "isOauthProxy" : "true" , ';
		postData += '"oauthProxyName" : "'+ lc.getCEProxy() +'" }, ';
		postData += '"tags" : [ "' + lc.getFullname() + ' - ' + lc.getConnectorName() + '" ], ';
		postData += '"name" : "'+ lc.getConnectorName() + '" }';
		
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	console.log("buildBullhornInstance header == " + header);
	console.log("buildBullhornInstance postData == " + postData);
	console.log("buildBullhornInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildBullhornInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\nbuildBullhornInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\nbuildBullhornInstance: ID == " + resp.id);
				console.log("\n\n\nbuildBullhornInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, state);

			} else {
				console.log("buildBullhornInstance: xhr.responseText == " + xhr.responseText)
				console.log("buildBullhornInstance: xhr.status == " + xhr.status)
				alert ("Bad Call")
			}
		}
	};
	xhr.send(postData);
}


