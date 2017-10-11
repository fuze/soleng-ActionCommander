'use strict'

const { remote } = require('electron');
const mainWindow = remote.getGlobal('mainWindow')
const pjson = remote.getGlobal('pjson')
const settings = require('../js/usersettings');
const reset = require('../js/util/resetBackGroundData');
const connect = require('../js/checkConnections');

console.debug("initializeMainPage " + JSON.stringify(pjson, null, 2));


window.onload = function () {
	reset.resetBackGroundData();
	console.debug("in InitializeMainPage " + 'bbbb');
	settings.getUserSettings(function(json) {
		console.debug("in InitializeMainPage " + JSON.stringify(json, null, 2));
		connect.checkConnectivity(json, function(retObj) {
			console.warn("InitializeMainPage: Socket" + JSON.stringify(retObj));
			if ( retObj.code == 200) {
				const fuzeListener = require('../js/fuzelistener');
				fuzeListener.startSocket(function(startObj) {
					if (startObj.code == 200) {
						console.warn("InitializeMainPage: Started Socket" + JSON.stringify(startObj));
					} else {
						fuzeListener.stopSocket(function(stopObj) {
							console.warn("InitializeMainPage: Socket Open Failed" + JSON.stringify(startObj));
						});
					}
				});
			}
		
		});
	});
}
