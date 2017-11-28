'use strict'

const { remote } = require('electron');
const mainWindow = remote.getGlobal('mainWindow')
const pjson = remote.getGlobal('pjson')
const settings = require('../js/usersettings');
const reset = require('../js/util/resetBackGroundData');
const connect = require('../js/checkConnections');
const endPointValidate = require('../js/validateEndPoint');
const Bus = require('electron-eventbus');
const eventBus = new Bus();

console.log("initializeMainPage " + JSON.stringify(pjson, null, 2));


window.onload = function () {
	reset.resetBackGroundData();
	console.log("in InitializeMainPage ");
	settings.getUserSettings(function(json) {
		console.log("in InitializeMainPage " + JSON.stringify(json, null, 2));
		connect.checkConnectivity(json, function(retObj) {
			console.warn("InitializeMainPage: Socket" + JSON.stringify(retObj));
			if ( retObj.code == 200) {
				// const fuzeListener = require('../js/fuzelistener');
				// fuzeListener.startSocket(function(startObj) {
				// 	if (startObj.code == 200) {
				// 		console.warn("InitializeMainPage: Started Socket" + JSON.stringify(startObj));
				// 		endPointValidate.validateEndPoint(function(epObj) {
				// 			if(epObj.code == 200) {
				// 				console.warn("CheckConnectivity: Validate End Point Success" + JSON.stringify(epObj));
				// 				eventBus.emit(epObj.action, epObj);
				// 				//retObj = epObj;
				// 			} else {
				// 				console.warn("CheckConnectivity: Validate End Point Failed Socket" + JSON.stringify(epObj));
				// 				eventBus.emit(epObj.action, epObj);
				// 				//retObj = epObj;
				// 				//callback(epObj);
				// 			}
				// 		});
                //
				// 	} else {
				// 		fuzeListener.stopSocket(function(stopObj) {
				// 			console.warn("InitializeMainPage: Socket Open Failed" + JSON.stringify(startObj));
				// 		});
				// 	}
				// });
			}

		});
	});
}
