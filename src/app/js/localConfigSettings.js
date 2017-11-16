'use strict'
const remote = require('electron').remote;
const mainWindow = remote.getGlobal('mainWindow')
const crypt = require('./util/util.password')


function localConfigSettings() {};
////////////////////////////////////////////////////////////////////////////////////////
// getUsername/setUsername
// This is used to get/set the fuze username
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getUsername = function() {
    return localStorage.getItem('fuze-username');
}
localConfigSettings.prototype.getTrimmedUsername = function() {
	var tmpuser = this.getUsername();
console.log("getTrimmedUsername " + tmpuser);
	if (tmpuser.indexOf(' ') > 0) {
		console.log("getTrimmedUsername " + tmpuser.substr(0, tmpuser.indexOf(' ')));
		return tmpuser.substr(0, tmpuser.indexOf(' '));
	} 
	console.log("getTrimmedUsername " + tmpuser);
	return tmpuser;
}

localConfigSettings.prototype.setUsername = function(username) {
console.log("setUsername: " + username);
    var previousUsername = this.getUsername();
    localStorage.setItem('fuze-username', username);
    if (username != previousUsername) {
    	mainWindow.webContents.send('username',username);
  }
}

////////////////////////////////////////////////////////////////////////////////////////
// getPassword/setPassword
// This is used to get/set the fuze password
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getPassword = function() {
  	return crypt.decryptPassword(localStorage.getItem('fuze-password'));
}
localConfigSettings.prototype.setPassword = function(password) {
console.log("setPassword: " + password);
    var previousPassword = this.getPassword();
    localStorage.setItem('fuze-password', password);
    if (password != previousPassword) {
    	mainWindow.webContents.send('password',password); 
    } 
}

////////////////////////////////////////////////////////////////////////////////////////
// getTenantId/setTenantId
// This is used to get the fuze tenant id
// The Tenant ID is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getTenantId = function() {
   return localStorage.getItem('fuze-tenantid');
}

localConfigSettings.prototype.setTenantId = function(tenantid) {
console.log("setTenantId: " + tenantid);
    var previousTenantId = this.getTenantId();
   	localStorage.setItem('fuze-tenantid', tenantid);
    if (tenantid != previousTenantId) {
    	mainWindow.webContents.send('tenantid',tenantid);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getTenantId/setTenantId
// This is used to get the fuze full name value
// The Full Name is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getFullname = function() {
    return localStorage.getItem('fullname');
}
localConfigSettings.prototype.setFullname = function(fullname) {
console.log("setFullname fullname: " + fullname);
    var previousFullname = this.getFullname();
    localStorage.setItem('fullname', fullname);
    if (fullname != previousFullname) {
    	mainWindow.webContents.send('fullname',fullname);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getSocketApproved/setSocketApproved
// This is used to get/set the.sockets has been successfully created
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getSocketApproved = function() {
    return localStorage.getItem('socketapproved');
}
localConfigSettings.prototype.setSocketApproved = function(socketapproved) {
console.log("setSocketApproved: " + socketapproved);
    var previousSocketApproved = this.getSocketApproved();
    localStorage.setItem('socketapproved', socketapproved);
    if (socketapproved != previousSocketApproved) {
    	mainWindow.webContents.send('fullname',fullname);
    } 
}

////////////////////////////////////////////////////////////////////////////////////////
// getCrmUser/setCrmUser
// This is used to get/set the crm/helpdesk user id 
// This is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
localConfigSettings.prototype.getCrmUser = function() {
    return localStorage.getItem('crm-user');
}
localConfigSettings.prototype.setCrmUser = function(crmUser) {
console.log("setCrmUser: " + crmUser);
    var previousCrmUser = this.getCrmUser();
    localStorage.setItem('crm-user', crmUser);
    if (crmUser != previousCrmUser) {
    	mainWindow.webContents.send('crmUser',crmUser);
    }
 
}
////////////////////////////////////////////////////////////////////////////////////////
// getPrompt/setPrompt
// ??????????
// This is used to get/set if the user should be prompted for their crm/helpdesk password 
// This is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
localConfigSettings.prototype.getPrompt = function() {
    return localStorage.getItem('prompt-user');
}
localConfigSettings.prototype.setPrompt = function(prompt) {
console.log("setPrompt: " + prompt);
    var previousPrompt = this.getPrompt();
    localStorage.setItem('prompt-user', prompt);
    if (prompt != previousPrompt) {
		mainWindow.webContents.send('prompt',prompt);
	}
}

////////////////////////////////////////////////////////////////////////////////////////
// getCloudElementsId/setCloudElementsId
// ??????????
// This is used to get/set if the user should be prompted for their crm/helpdesk password 
// This is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
localConfigSettings.prototype.getCloudElementsId = function() {
    return localStorage.getItem('ceid');
}
localConfigSettings.prototype.setCloudElementsId = function(ceid) {
console.log("ceid: " + ceid);
    var previousCloudElementsId = this.getCloudElementsId();
    localStorage.setItem('ceid', ceid);
    if (ceid != previousCloudElementsId) {
    	mainWindow.webContents.send('ceid',ceid);
	} 

}

////////////////////////////////////////////////////////////////////////////////////////
// getCloudElementsId/setCloudElementsId
// ??????????
// This is used to get/set if the user should be prompted for their crm/helpdesk password 
// This is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
localConfigSettings.prototype.getCrmToken = function() {
    return localStorage.getItem('crm-token');
}
localConfigSettings.prototype.setCrmToken = function(crmToken) {
console.log("setCrmToken: " + crmToken);
    var previousCrmToken = this.getCrmToken();
    localStorage.setItem('crm-token', crmToken);
    if (crmToken != previousCrmToken) {
    	mainWindow.webContents.send('crmToken',crmToken);
	} 

}
////////////////////////////////////////////////////////////////////////////////////////
// Fuze CRM Instance

localConfigSettings.prototype.getCrmInstance = function() {
    return localStorage.getItem('crm-instance');
}
localConfigSettings.prototype.setCrmInstance = function(crmInstance) {
console.log("setCrmInstance: " + crmInstance);
    var previousCrmInstance = this.getCrmInstance();
    localStorage.setItem('crm-instance', crmInstance);
    if (crmInstance != previousCrmInstance) {
    	mainWindow.webContents.send('crmInstance',crmInstance);
	} 
}
////////////////////////////////////////////////////////////////////////////////////////
// Fuze CRM Base URL
// ??????????
localConfigSettings.prototype.getCrmBaseUrl = function() {
    return localStorage.getItem('crm-baseurl');
}
localConfigSettings.prototype.setCrmBaseUrl = function(crmBaseUrl) {
console.log("setCrmBaseUrl: " + crmBaseUrl);
    var previousCrmBaseUrl = this.getCrmBaseUrl();
    localStorage.setItem('crm-baseurl', crmBaseUrl);
    if (crmBaseUrl != previousCrmBaseUrl) {
    	mainWindow.webContents.send('crmBaseUrl',crmBaseUrl);
	} 
    
}
////////////////////////////////////////////////////////////////////////////////////////
// Fuze CRM Base Option
localConfigSettings.prototype.getCrmUrlOption = function() {
    return localStorage.getItem('crm-urloption');
}
localConfigSettings.prototype.setCrmUrlOption = function(crmUrlOption) {
console.log("setCrmBaseUrl: " + crmUrlOption);
    var previousCrmUrlOption = this.getCrmUrlOption();
    localStorage.setItem('crm-urloption', crmUrlOption);
    if (crmUrlOption != previousCrmUrlOption) {
    	mainWindow.webContents.send('crm-urloption',crmUrlOption);
	}  
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Name
localConfigSettings.prototype.getCrmJSPackage = function() {
    return localStorage.getItem('jspackage');
}
localConfigSettings.prototype.setCrmJSPackage = function(jspackage) {
console.log("jspackage: " + jspackage);
    localStorage.setItem('jspackage', jspackage);
    
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Type
localConfigSettings.prototype.getCrmType = function() {
    return localStorage.getItem('type');
}
localConfigSettings.prototype.setCrmType = function(type) {
console.log("type: " + type);
    localStorage.setItem('type', type);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Route Path
localConfigSettings.prototype.getRoutePath = function() {
    return localStorage.getItem('routepath');
}
localConfigSettings.prototype.setRoutePath = function(routepath) {
console.log("setRoutePath: " + routepath);
    localStorage.setItem('routepath', routepath);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #1  Screen #1
localConfigSettings.prototype.getAnchorPrimary = function() {
    return localStorage.getItem('panchor');
}
localConfigSettings.prototype.setAnchorPrimary = function(panchor) {
console.log("panchor: " + panchor);
    localStorage.setItem('panchor', panchor);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #2  Screen #1
localConfigSettings.prototype.getAnchorSecondary = function() {
    return localStorage.getItem('sanchor');
}
localConfigSettings.prototype.setAnchorSecondary = function(sanchor) {
console.log("sanchor: " + sanchor);
    localStorage.setItem('sanchor', sanchor);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #2  Screen #1
localConfigSettings.prototype.getAnchorTertiary = function() {
    return localStorage.getItem('tanchor');
}
localConfigSettings.prototype.setAnchorTertiary = function(tanchor) {
console.log("tanchor: " + tanchor);
    localStorage.setItem('tanchor', tanchor);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #2  Screen #2
localConfigSettings.prototype.getContentPrimary = function() {
    return localStorage.getItem('pcontent');
}
localConfigSettings.prototype.setContentPrimary = function(pcontent) {
console.log("pcontent: " + pcontent);
    localStorage.setItem('pcontent', pcontent);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #3  Screen #1
localConfigSettings.prototype.getContentSecondary = function() {
    return localStorage.getItem('scontent');
}
localConfigSettings.prototype.setContentSecondary = function(scontent) {
console.log("scontent: " + scontent);
    localStorage.setItem('scontent', scontent);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Object #3  Screen #2
localConfigSettings.prototype.getContentTertiary = function() {
    return localStorage.getItem('tcontent');
}
localConfigSettings.prototype.setContentTertiary = function(tcontent) {
console.log("tcontent: " + tcontent);
    localStorage.setItem('tcontent', tcontent);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Admin User Name
localConfigSettings.prototype.getCrmAdminUser = function() {
    return localStorage.getItem('crmadminuser');
}
localConfigSettings.prototype.setCrmAdminUser = function(crmadminuser) {
console.log("crmadminuser: " + crmadminuser);
    localStorage.setItem('crmadminuser', crmadminuser);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Admin User Passwd
localConfigSettings.prototype.getCrmAdminPasswd = function() {
    return localStorage.getItem('crmadminpass');
}
localConfigSettings.prototype.setCrmAdminPasswd = function(crmadminpass) {
console.log("crmadminpass: " + crmadminpass);
    localStorage.setItem('crmadminpass', crmadminpass);
    return;
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Auth Status 
localConfigSettings.prototype.getCrmAuthStatus = function() {
    return JSON.parse(localStorage.getItem('crmauthstatus'));
}
localConfigSettings.prototype.setCrmAuthStatus = function(crmauthstatus) {
	console.log("crmauthstatus: " + crmauthstatus);
	
	if(crmauthstatus == 0) {
		setCrmAuthMessage('Not Authorized');
	} else {
		setCrmAuthMessage('Authorized');
	}
	
	var previousCrmAuthStatus = this.getCrmAuthStatus();
    localStorage.setItem('crmauthstatus', crmauthstatus);
    if (crmauthstatus != previousCrmAuthStatus) {
    	mainWindow.webContents.send('crmauthstatus',crmauthstatus);
	} 

}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Auth Status 
localConfigSettings.prototype.getCrmAuthMessage = function() {
    return localStorage.getItem('crmauthmessage');
}
localConfigSettings.prototype.setCrmAuthMessage = function(crmauthmessage) {
console.log("crmauthmessage: " + crmauthmessage);		
 	var previousCrmAuthMessage = this.getCrmAuthMessage();
    localStorage.setItem('crmauthmessage', crmauthmessage);
    if (crmauthmessage != previousCrmAuthMessage) {
    	mainWindow.webContents.send('crmauthmessage',crmauthmessage);
	} 
}
////////////////////////////////////////////////////////////////////////////////////////
//  Connector Name for Title
localConfigSettings.prototype.getConnectorName = function() {
    return localStorage.getItem('connectorname');
}
localConfigSettings.prototype.setConnectorName = function(connectorname) {
console.log("connectorname: " + connectorname);
    localStorage.setItem('connectorname', connectorname);
}
////////////////////////////////////////////////////////////////////////////////////////
//  Call Recording Link Base
localConfigSettings.prototype.getRecordingLinkBase = function() {
    return localStorage.getItem('linkbase');
}
localConfigSettings.prototype.setRecordingLinkBase = function(linkbase) {
	console.log("linkbase: " + linkbase);
    localStorage.setItem('linkbase', linkbase);
}
////////////////////////////////////////////////////////////////////////////////////////
//  Call Recording Link Base
localConfigSettings.prototype.getEmailAddr = function() {
    return localStorage.getItem('email');
}
localConfigSettings.prototype.setEmailAddr = function(email) {
console.log("Setting email" + email);
	console.log("email: " + email);
    localStorage.setItem('email', email);
}
////////////////////////////////////////////////////////////////////////////////////////
// getCEInstanceID
localConfigSettings.prototype.getCEInstanceID = function() {
    return localStorage.getItem('ceinstance');
}
localConfigSettings.prototype.setCEInstanceID = function(ceinstance) {
	console.log("ceinstance: " + ceinstance);
    localStorage.setItem('ceinstance', ceinstance);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE Type
localConfigSettings.prototype.getCEType = function() {
    return localStorage.getItem('cetype');
}
localConfigSettings.prototype.setCEType = function(cetype) {
console.log("cetype: " + cetype);
    localStorage.setItem('cetype', cetype);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE oAuth URL
localConfigSettings.prototype.getCEOauthUrl = function() {
    return localStorage.getItem('ceoauthurl');
}
localConfigSettings.prototype.setCEOauthUrl = function(ceoauthurl) {
console.log("ceoauthurl: " + ceoauthurl);
    localStorage.setItem('ceoauthurl', ceoauthurl);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE Key
localConfigSettings.prototype.getCEKey = function() {
    return localStorage.getItem('key');
}
localConfigSettings.prototype.setCEKey = function(key) {
console.log("key: " + key);
    localStorage.setItem('key', key);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE Secret
localConfigSettings.prototype.getCESecret = function() {
    return localStorage.getItem('secret');
}
localConfigSettings.prototype.setCESecret = function(secret) {
console.log("secret: " + secret);
    localStorage.setItem('secret', secret);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE Proxy
localConfigSettings.prototype.getCEProxy = function() {
    return localStorage.getItem('proxy');
}
localConfigSettings.prototype.setCEProxy = function(proxy) {
console.log("proxy: " + proxy);
    localStorage.setItem('proxy', proxy);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE User
localConfigSettings.prototype.getUserToken = function() {
    return localStorage.getItem('utoken');
}
localConfigSettings.prototype.setUserToken = function(utoken) {
console.log("utoken: " + utoken);
    localStorage.setItem('utoken', utoken);
}
////////////////////////////////////////////////////////////////////////////////////////
// CE Org
localConfigSettings.prototype.getOrgToken = function() {
    return localStorage.getItem('otoken');
}
localConfigSettings.prototype.setOrgToken = function(otoken) {
console.log("otoken: " + otoken);
    localStorage.setItem('otoken', otoken);
}
////////////////////////////////////////////////////////////////////////////////////////
// WrapUp Codes enabled  NO == false
localConfigSettings.prototype.getWrapUpCode = function() {
    return localStorage.getItem('wcode');
}
localConfigSettings.prototype.setWrapUpCode = function(wcode) {
	if (wcode == null) {
		wcode = false;
		console.log("localConfig: setWrapUpCode wcode: " + wcode);
	}
    localStorage.setItem('wcode', wcode);
}
/////////////////////////////////////////////////////////////////////////////////////////
// Call Notes enabled NO == false
localConfigSettings.prototype.getCallNotes = function() {
    return localStorage.getItem('cnotes');
}

localConfigSettings.prototype.setCallNotes = function(cnotes) {
	if (cnotes == null) {
		cnotes = false;
		console.log("localConfig: setWrpUpValue notecode: " + cnotes);
	}
    localStorage.setItem('cnotes', cnotes);
}

////////////////////////////////////////////////////////////////////////////////////////
// Vtiger Recording Field
localConfigSettings.prototype.getPhonePattern = function() {
   return localStorage.getItem('phonepattern');
}
localConfigSettings.prototype.setPhonePattern = function(phonepattern) {
console.log("phonepattern: " + phonepattern);
    localStorage.setItem('phonepattern', phonepattern);
}
////////////////////////////////////////////////////////////////////////////////////////
// Phone Number Pattern Recording Field
localConfigSettings.prototype.getRecordingField = function() {
	return localStorage.getItem('vtrecfield');
    
}
localConfigSettings.prototype.setRecordingField = function(vtrecfield) {
console.log("vtrecfield: " + vtrecfield);
    localStorage.setItem('vtrecfield', vtrecfield);
}
////////////////////////////////////////////////////////////////////////////////////////
// Warden Token Field
localConfigSettings.prototype.getWardenToken = function() {
    return localStorage.getItem('wardenToken');

}
localConfigSettings.prototype.setWardenToken = function(wardenToken) {
    console.log("wardenToken: " + wardenToken);
    localStorage.setItem('wardenToken', wardenToken);
}

//////////////////////////////////////////////////////////////////////////////////////////
// getUserDataCallBack
localConfigSettings.prototype.setLocalUserData = function (userdata) {
	console.log("setLocalUserData <" + JSON.stringify(userdata, null,2) )
	
	this.setUsername(userdata.username);
	this.setPassword(userdata.password);
	
	var ceToken = userdata.user_ce_id + ', ';
	ceToken += userdata.company_ce_id + ', ';
	ceToken += userdata.integration_ce_id;
		
	this.setPhonePattern(userdata.phone_pattern);
	this.setCloudElementsId(userdata.CloudElementsId);
	this.setCEInstanceID(userdata.ce_instance_id);
	this.setEmailAddr(userdata.email);
	this.setCrmToken(userdata.accesscode);
	this.setTenantId(userdata.tenant_id);
	this.setCrmInstance(userdata.instance);	
	this.setCrmBaseUrl(userdata.baseurl);
	this.setCrmUrlOption(userdata.url_option);
	this.setConnectorName(userdata.integration_name);
	this.setRecordingLinkBase(userdata.recordingbaseurl);
	this.setCrmJSPackage(userdata.package);
	this.setCrmType(userdata.type);
	this.setCEType(userdata.ce_type);
	this.setCEOauthUrl(userdata.oauth_proxy_url);
	this.setRoutePath(userdata.routepath);
	this.setAnchorPrimary(userdata.anchor_primary);
	this.setAnchorSecondary(userdata.anchor_secondary);
	this.setAnchorTertiary(userdata.anchor_tertiary);
	this.setContentPrimary(userdata.content_primary);
	this.setContentSecondary(userdata.content_secondary);
	this.setContentTertiary(userdata.content_tertiary);
	this.setCrmAdminUser(userdata.adminuser);
	this.setCrmAdminPasswd(userdata.adminpasswd);
	this.setCESecret(userdata.consumer_secret);
	this.setCEKey(userdata.consumer_key);
	this.setCEProxy(userdata.ce_proxy_name)
	this.setUserToken(userdata.user_ce_id);
	this.setOrgToken(userdata.company_ce_id);
	this.setWrapUpCode(userdata.wrapup_codes);	
	this.setCallNotes(userdata.call_notes); 	
	this.setRecordingField(userdata.recording_field);
	this.setPhonePattern(userdata.phone_pattern);
	this.setCrmUser(userdata.crmid);

	this.setFullname(userdata.fname + ' ' + userdata.lname);
    this.setWardenToken(userdata.wardenToken);

}
module.exports = new localConfigSettings();
