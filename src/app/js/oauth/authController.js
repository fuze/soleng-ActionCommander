'use strict'

const { remote, ipcRenderer } = require('electron');

const pjson = remote.getGlobal('pjson');
const lc = require('../localConfigSettings');
const oAuthUtils = require('./authUtilities');
const buildSfdc = require('./buildSFDCInstance');

const cldElmntsProvUrl 	= pjson.config.cldElmntsProvUrl;

////////////////////////////////////////////////////////////////////////////////////////
exports.authController = function() {

	var domain = lc.getCrmBaseUrl().split('.');
		domain = domain[0].replace(/.*?:\/\//g, "");
		
	console.log("authController: CRM User== " + lc.getCrmUser());
	
	if ((lc.getCEType() == 'sfdcservicecloud') || (lc.getCEType() == 'sfdc'))  {

		var url = cldElmntsProvUrl + lc.getCEType() +'/oauth/url';
		console.log("authController: URL == " + url);
		oAuthUtils.authGetProxy(url, lc.getCrmBaseUrl());
		
	} else if (lc.getCEType() == 'zendesk') {
	
		var url = cldElmntsProvUrl + lc.getCEType() +'/oauth/url';
		oAuthUtils.authGetProxy(url, domain);
		
	} else if (lc.getCEType() == 'servicenow') {

		ipcRenderer.send('open-password-window', pjson.config.passwdurl);
		
	} else if (lc.getCEType() == 'dynamicscrmadfs') {
	
		ipcRenderer.send('open-password-window', pjson.config.passwdurl);
	
	} else if (lc.getCEType() == 'zohocrm') {
	
		ipcRenderer.send('open-password-window', pjson.config.passwdurl);
	
	} else if (lc.getCEType() == 'bullhorn') {

		url = cldElmntsProvUrl +'1702/oauth/url';
		console.log("authController: URL == " + url);
		oAuthUtils.authGetProxy(url, lc.getCrmBaseUrl());

	} else if (lc.getCEType() == 'netsuitecrmv2') {

		ipcRenderer.send('open-password-window', pjson.config.passwdurl);

	}

}
