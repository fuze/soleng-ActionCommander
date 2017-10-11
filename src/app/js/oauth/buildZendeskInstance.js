'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;
const fuzeoAuthCallBack 	= pjson.config.fuzeoAuthCallBack;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildZendeskInstance = function(results, responce, state) {
	console.log("buildZendeskInstance buildTheInstance  results== " + JSON.stringify(results));
	console.log("buildZendeskInstance buildTheInstance  responce== " + JSON.stringify(responce));
	
	var url = cloudElementsApiUrl + 'instances';
	
	var domain = lc.getCrmBaseUrl().split('.');
		domain = domain[0].replace(/.*?:\/\//g, "");
	
	var postData = '{ "element" : { "key" : "' + results.element + '" }, ';
		postData += '"providerData" : { "code" : "' + responce[0].code + '" }, ';
 		postData += '"configuration" : { "zendesk.subdomain" : "' + domain + '", ';
		postData += '"oauth.api.key" : "'+ lc.getCEKey() +'" , ';
		postData += '"oauth.api.secret" : "'+ lc.getCESecret() +'", ';
		postData += '"oauth.callbackUrl" : "' + lc.getCEProxy() + '" }, ';	
		//postData += '"oauth.callbackUrl" : "' + fuzeoAuthCallBack + '" }, ';
		postData += '"oauthProxy" : { "isOauthProxy" : "true" , ';
		postData += '"oauthProxyName" : "'+ lc.getCEProxy() +'" }, ';
		postData += '"tags" : [ "' + lc.getFullname() + ' - ' + lc.getConnectorName() + '-INSTALL-TEST" ], ';
		postData += '"name" : "'+ lc.getConnectorName() + '" }';
		
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	//var header = _Settings.fuzeUserToken + ', ' +  _Settings.fuzeOrgToken;    
	console.log("buildZendeskInstance header == " + header);
	console.log("buildZendeskInstance postData == " + postData);
	console.log("buildZendeskInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildZendeskInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\n\buildZendeskInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\n\buildZendeskInstance: ID == " + resp.id);
				console.log("\n\n\n\buildZendeskInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, state);
				
			} else {
				console.log("buildZendeskInstance: xhr.responseText == " + xhr.responseText)
				console.log("buildZendeskInstance: xhr.status == " + xhr.status)
				//alert ("Bad Call")
			}
		}
	};
	xhr.send(postData);
}


