'use strict'

const { remote } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const userData = require('./authUserUpdate');

const cloudElementsApiUrl 	= pjson.config.cloudElementsApiUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.buildServiceNowInstance = function(user, password, callback) {
	
	var url = cloudElementsApiUrl +'instances';
	var domain = lc.getCrmBaseUrl().split('.');
		domain = domain[0].replace(/.*?:\/\//g, "");
	
	console.log("buildSNowInstance: User == " + user);
	console.log("buildSNowInstance: Password == " + password);
	console.log("buildSNowInstance: domain 0 == " + domain);
	var postData = '{ "element" : { "key" : "servicenow" }, ';
		//postData += '"providerData": { "code" : "1000" }, ';
		postData += '"configuration": { ';
    	postData += '"username":"' + user + '",  ';
    	postData += '"password":"'+ password + '", ';
    	if (lc.getCEKey() && lc.getCEKey()) {
    		postData += '"oauth.api.key" : "'+ lc.getCEKey() +'" , ';
			postData += '"oauth.api.secret" : "'+ lc.getCESecret() +'", ';
		}
    	postData += '"servicenow.subdomain":"' + domain +'" }, ';
  		postData += '"tags": ["' + lc.getFullname() + ' - ' + lc.getConnectorName() + '"], ';
  		postData += '"name": "'+ lc.getConnectorName() + '"}';
	
	var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	//var header = _Settings.fuzeUserToken + ', ' +  _Settings.fuzeOrgToken;    
	console.log("buildSNowInstance header == " + header);
	console.log("buildSNowInstance postData == " + postData);
	console.log("buildSNowInstance URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("buildSNowInstance: resp.success == " + xhr.responseText);
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\n\buildSNowInstance: oauthUrl == " + JSON.stringify(resp));
				console.log("\n\n\n\buildSNowInstance: ID == " + resp.id);
				console.log("\n\n\n\buildSNowInstance: token == " + resp.token);
				userData.updateUserData(resp.id, resp.token, null, callback);
				//callback();
			} else if ( xhr.status == 401 ) {
				alert("Please Check UserName and Password");
				//callback();
				authCnt.authController();
			} else {
				//alert("General Error\n" + xhr.responseText);
				console.log("buildTheInstance: xhr.responseText == " + xhr.responseText);
				console.log("buildTheInstance: xhr.status == " + xhr.status);
				callback();
			}
		}
	};
	xhr.send(postData);

}
