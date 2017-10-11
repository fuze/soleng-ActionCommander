'use strict'

const { remote, shell } = require('electron');
const pjson = remote.getGlobal('pjson');

const lc 	= require('../localConfigSettings');
const sfdc 	= require('./buildSFDCInstance');
const zen	= require('./buildZendeskInstance');

const updateUserDataUrl = pjson.config.updateUserDataUrl;
const updateTempKeys	= pjson.config.updateTempKeys;
const getTempKeys		= pjson.config.getTempKeys;
const fuzeoAuthCallBack = pjson.config.fuzeoAuthCallBack;
const tempKeysIter		= pjson.config.tempKeysIter;
const tempKeysTimeOut 	= pjson.config.tempKeysTimeOut

function oauthUtils() {};
////////////////////////////////////////////////////////////////////////////////////////
oauthUtils.prototype.authGetProxy = function(url, siteaddress) {

	console.log("authGetProxy Cloud Elements Type == " + lc.getCEType() );
	console.log("authGetProxy Cloud Elements Oauth URL == " + lc.getCEOauthUrl());
	console.log("authGetProxy Cloud siteAddress == " + siteaddress);
	
	var postData = '{ "apiKey" : "' + lc.getCEKey() + '" , ';
		postData += '"apiSecret" : "' + lc.getCESecret() + '", ';
		postData += '"callbackUrl" : "'+ lc.getCEOauthUrl() +'", ';
		postData += '"oauthProxyName" : "'+ lc.getCEProxy() +'", ';
		postData += '"isOAuthProxy" : "true", ';
		postData += '"state" : "'+ fuzeoAuthCallBack +'",';
		postData += '"siteAddress" : "' + siteaddress + '" }'; 
	
	  var header = lc.getUserToken() + ', ' + lc.getOrgToken();
	 
	console.log("authGetProxy header == " + header);
	console.log("authGetProxy postData == " + postData);
	console.log("authGetProxy URL == " + url);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("getOauthProxy: resp.success == " + xhr.responseText)
				var resp = JSON.parse( xhr.responseText );
				console.log("\n\n\n\ngetOauthProxy: oauthUrl == " + resp.oauthUrl)
				var newUrl = resp.oauthUrl;
				shell.openExternal(newUrl);
				//oAuthWin = window.open(newUrl, "OAUTH");
				parseAuthData(resp);
			} else {
				alert("xhr.responseText == " + xhr.responseText)
				alert("xhr.status == " + xhr.status)
				alert ("Bad Call")
			}
		}
	}
	xhr.send(postData);
};

////////////////////////////////////////////////////////////////////////////////////////
function parseAuthData(responce) {
	var i = 0; var result = undefined;
	console.log("setCEValues responce == " + JSON.stringify(responce));
	//console.log("setCEValues oAuthWin == " + oAuthWin);
	
	var url = responce.oauthUrl;
	var stateIndx = url.indexOf('state=');
	var stateEndIndx = url.indexOf('&');
	if (stateIndx > -1 ) {
		var state = url.substring(stateIndx);
		state = state.substring(state.indexOf('=') + 1);
		if (stateEndIndx > -1) {
			state = state.substring(0, state.indexOf('&'));
		}
		console.log("parseAuthData state == " + state);
		console.log("parseAuthData responce.oauthUrl == " + responce.oauthUrl);
	}
	
	getOauthCodeForElement(state, responce, 0); 
	
	console.log ("parseAuthDatas: After Get Window");
	var element = responce.element;
	console.log("parseAuthData element == " + element);
	
}

////////////////////////////////////////////////////////////////////////////////////////
function getOauthCodeForElement(state, responce, count) {
console.log("getOauthCodeForElement state == " + state);
console.log("getOauthCodeForElement responce == " + JSON.stringify(responce, null, 2));
//console.log("getOauthCodeForElement oAuthWin == " + oAuthWin);
console.log("getOauthCodeForElement count == " + tempKeysIter);

	if (count < tempKeysIter) {
		setTimeout(function () {
			console.log("getOauthCodeForElement count == " + count);
			count++;
			console.log("getOauthCodeForElement count == " + count);
			var url = getTempKeys + state;
			console.log("getOauthCodeForElement: URL == " + url);
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.onreadystatechange = function() {
		 		if (xhr.readyState == 4) {
					if ( xhr.status == 200 ) {
						console.log("getOauthCodeFOrElement: resp.success == " + xhr.responseText)
						var resp = JSON.parse( xhr.responseText );
						console.log("getOauthCodeForElement: resp length == " + resp.length)
						console.log("getOauthCodeForElement: resp == " + JSON.stringify(resp));
						console.log("getOauthCodeForElement: resp == " + JSON.stringify(resp[0]));
						if( resp !== undefined && resp.length > 0) {
							count = count + tempKeysIter;
							console.log("getOauthCodeForElement : dotheCallBack here");
							console.log("getOauthCodeForElement No responce == " + count);
							//oAuthWin.close();
							
							buildTheInstance(responce, resp, state);
							//getOauthCodeForElement(state, responce, tempKeysIter + count);	
							
						} else {
							console.log("getOauthCodeForElement count last resp == " + resp);
							console.log("getOauthCodeForElementcount last == " + count);
							getOauthCodeForElement(state, responce, count);	
						}
					} else {
						console.log("getOauthCodeForElement: xhr.responseText == " + xhr.responseText)
						console.log("getOauthCodeForElementt: xhr.status == " + xhr.status)
						console.log("getOauthCodeForElement: Bad Call")
					}
				}
			};
			xhr.send();
		
		}, tempKeysTimeOut * 1000);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function buildTheInstance(responce, resp, state) {
	console.log('buildTheInstance');
	if ((lc.getCEType() == 'sfdcservicecloud') || (lc.getCEType() == 'sfdc'))  {
		console.log('buildTheInstance buildSFDCInstance');
		sfdc.buildSFDCInstance(responce, resp, state);
	} else if (lc.getCEType() == 'zendesk') {
		console.log('buildTheInstance buildZendeskInstance');
		zen.buildZendeskInstance(responce, resp, state);
	}
}

module.exports = new oauthUtils();
