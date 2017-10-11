'use strict'

const settings = require('electron-settings');
const isDev = (require('electron-is-dev') || global.appSettings.debug);

const fs = require('fs');
const _ = require('lodash');
const remote = require('electron').remote;
const pjson = remote.getGlobal('pjson')
const crypt = require('./util/util.password');
const Bus = require('electron-eventbus');
const eventBus = new Bus();
const lc = require('./localConfigSettings');

var config = pjson.config;

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
function UserSettings() {};

//////////////////////////////////////////////////////////////////////////////////////////
// setCmrId
UserSettings.prototype.resetSettings = function(callback) {
	var settingsFilePath = settings.file();
	console.debug('\n settingsFilePath : ' + settingsFilePath)
    try {
      fs.unlinkSync(settingsFilePath);
    } catch (err) {
      console.error("Failed to Remove the file " + settingsFilePath)
    }
    settings.clearPath();
    callback(settingsFilePath);
    
}

//////////////////////////////////////////////////////////////////////////////////////////
// setCmrId
function setCrmId(id, callback) {
	var obj = settings.getAll();
		obj = obj.userData;
	console.debug('setCmrId id: ' + id)
	console.debug('setCmrId obj: ' + JSON.stringify(obj, null, 2) +'\n\n')
	obj['crmid'] = id;
	//settings.set('{ "userData" : { "crmid" : "' + id + '" } }');
	settings.setAll({ userData : obj });
	console.debug('setCmrId obj: ' + JSON.stringify(settings.getAll(), null, 2) +'\n\n')
	callback(settings.getAll())
}

//////////////////////////////////////////////////////////////////////////////////////////
// setSettings
function setSettings(results, passwd, callback) {
	results['password'] = crypt.encryptPassword(passwd)
	results['CloudElementsId'] = results.company_ce_id + ", " + results.integration_ce_id + ", " + results.user_ce_id;
	settings.setAll({ userData : results });
	var obj = settings.getAll()
	console.debug('\n\nsetSettings obj: ' + JSON.stringify(obj, null, 2) +'\n\n')
	callback(obj)
}

//////////////////////////////////////////////////////////////////////////////////////////
// getUserData
 function getUserData(username, password, callback) {
	
	console.debug('getUserData:  ' + JSON.stringify(config, null, 2));

	var url = config.getUserDataUrl + username;
	var resp;
	console.debug('getUserData:  ' + url);
	// Get inbox entries
  	var xhr = new XMLHttpRequest();
  	xhr.open('GET', url, true);
  	xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		console.debug('getUserData:  ' + xhr.responseText);
      		var results = JSON.parse(xhr.responseText)
      		if (results.length <= 0) {
        		console.debug('getUserData: getUserData: data 0 == ' + JSON.stringify(results, null, 2));
        		
        		callback(JSON.parse('{"code" : 404, "action" : 1005, "event" : "no-matching-user",  "message" : "No Matching User" }'));

      		} else if (results.length > 1) {
		 		callback(JSON.parse('{"code" : 409, "action" : 1006, "event" : "too-many-matching-user",  "message" : "Too Many Matching User" }'));
      		} else  {
				results = results[0];
				setSettings(results, password, callback)
      		}
  		}
	}
	xhr.send();
};

//////////////////////////////////////////////////////////////////////////////////////////
// getUserSettings
UserSettings.prototype.getUserSettings = function (callback) {

console.debug('getUserSettings: global.appSettings == ' + JSON.stringify(pjson.config, null, 2));

  //var filename = settings.getSettingsFilePath()
  var filename = settings.file()
  console.debug('is this where I would check for settings ' + filename)

	fs.exists(filename, function(exists) {
		if (exists) { 
			fs.stat(filename, function(err, stats) {
        		if (stats.isDirectory()) {
          			console.log('getUserSettings: ' + filename + ' : is a directory');
					callback(JSON.parse('{"code" :500, "action" : 1007, "event" : "cannot-create-user-settings",  "message" : "Cannot Create User Settings"}'));
        		} else {
  					var username = settings.get('userData.username');
  					var password = crypt.decryptPassword(settings.get('userData.password'))
  					console.debug('getUserSettings: username == ' + username)
  					console.debug('getUserSettings: password == ' + password)
					getUserData(username, password, function(obj) {
						console.log('getUserSettings: Settings will be Refreshed or Created' );
						processUserData(obj, function(ret) {
							console.log('createUserSettings: ' + JSON.stringify(ret, null, 2));
							callback(ret);
						});
						/*
						console.warn(JSON.stringify(obj, null, 2));
						//callback(obj);
						if (!obj.hasOwnProperty('code')) {
							console.warn('getUserSettings: No Code');
							if (obj.userData.active !== 'Yes') {
								_.merge(pjson.config, obj)
								callback(JSON.parse('{"code" : 403, "action" : 1004, "event" : "user-not-active",  "message" : "User Not Active" }'));
							} else if (obj.userData.crmid === '_prompt') {
								lc.setLocalUserData(obj.userData);
								_.merge(pjson.config, obj)
								console.warn("User Data getUserSettings" + JSON.stringify(pjson, null, 2));
								callback(JSON.parse('{"code" : 202, "action" : 1001, "event" : "prompt-for-user-name",  "message" : "Prompt For User Name" }'));
								console.log('getUserSettings: obj.userData.crmid ' + obj.userData.crmid);
							} else if (obj.userData.ce_id === '') {
								lc.setLocalUserData(obj.userData);
								_.merge(pjson.config, obj)
								console.warn("User Data getUserSettings" + JSON.stringify(pjson, null, 2));
								callback(JSON.parse('{"code" : 206, "action" : 1003, "event" : "no-end-point-defined",  "message" : "No End Point Defined" }'));
								console.log('getUserSettings: obj.userData.crmid ' + obj.userData.crmid);
							} else {
								_.merge(pjson.config, obj)
								lc.setLocalUserData(obj.userData);
								callback(JSON.parse('{"code" : 200, "action" : 1000, "event" : "complete-user-data", "message" : "Complete User Data" }'));
							}
						} else {
								callback(obj);
						}
						*/
					})
				}
			})
		} else {
			console.log('getUserSettings: No Data ');
			callback(JSON.parse('{"code" : 204, "action" : 1002, "event" : "show-login-window",  "message" : "No Settings Available Show Login"}'));
		} 
	})
}
//////////////////////////////////////////////////////////////////////////////////////////
// createUserSettings
//UserSettings.prototype.createUserSettings = function (username, password, callback) {
UserSettings.prototype.createUserSettings = function (username, password, callback) {
	console.debug('createUserSettings: global.appSettings == ' + JSON.stringify(pjson.config, null, 2));
	getUserData(username, password, function(obj) {
		console.log('createUserSettings: Settings will be Refreshed or Created' );	
		processUserData(obj, function(ret) {
			console.log('createUserSettings: ' + JSON.stringify(ret, null, 2));
			callback(ret);
		});

	})
}
//////////////////////////////////////////////////////////////////////////////////////////
// Process UserData Value
function processUserData(obj, callback) {

	console.log('getUserSettings: Settings will be Refreshed or Created' );
	console.warn(JSON.stringify(obj, null, 2));
	//callback(obj);
	if (!obj.hasOwnProperty('code')) {
		console.warn('getUserSettings: No Code');
		if (obj.userData.active !== 'Yes') {
			lc.setLocalUserData(obj.userData);
			_.merge(pjson.config, obj)
			callback(JSON.parse('{"code" : 403, "action" : 1004, "event" : "user-not-active",  "message" : "User Not Active" }'));
		} else if (obj.userData.crmid === '_prompt') {
			lc.setLocalUserData(obj.userData);
			_.merge(pjson.config, obj)
			console.warn("User Data getUserSettings" + JSON.stringify(pjson, null, 2));
			callback(JSON.parse('{"code" : 202, "action" : 1001, "event" : "prompt-for-user-name",  "message" : "Prompt For User Name" }'));
			console.log('getUserSettings: obj.userData.crmid ' + obj.userData.crmid);
		} else if (obj.userData.integration_ce_id === '') {
			lc.setLocalUserData(obj.userData);
			_.merge(pjson.config, obj)
			console.warn("User Data getUserSettings" + JSON.stringify(pjson, null, 2));
			callback(JSON.parse('{"code" : 206, "action" : 1003, "event" : "no-end-point-defined",  "message" : "No End Point Defined" }'));
			console.log('getUserSettings: obj.userData.crmid ' + obj.userData.crmid);
		} else {
			lc.setLocalUserData(obj.userData);
			_.merge(pjson.config, obj)
			//mainWindow.webContents.send('complete-user-data',200, 1000, 'Complete User Data');
			callback(JSON.parse('{"code" : 200, "action" : 1000, "event" : "complete-user-data", "message" : "Complete User Data" }'));
		}
	} else {
		callback(obj);
	}
}

//////////////////////////////////////////////////////////////////////////////////////////
// AddPrompted Value
UserSettings.prototype.addPromptedUsername = function (username, callback) {
	console.warn("User Data " + JSON.stringify(pjson, null, 2));
	setCrmId(username, function(obj) {
		console.warn("User Data addPromptedUsername " + JSON.stringify(obj, null, 2));
		if (obj.userData.crmid !== '_prompt') {
			lc.setCrmUser(obj.userData.crmid);
			lc.setLocalUserData(obj.userData);
    		_.merge(pjson.config, obj)
    		callback(obj, JSON.parse('{"code" : 200, "action" : 1000, "event" : "complete-user-data", "message" : "Complete User Data" }'));
    	} else {
    		console.error('userPrompt:  Something is Wrong' + JSON.stringify(obj, null, 2))
    		callback(obj, JSON.parse('{"code" : 202, "action" : 1001, "event" : "prompt-for-user-name",  "message" : "Prompt For User Name" }'));
    	}
	});
}


module.exports = new UserSettings()
