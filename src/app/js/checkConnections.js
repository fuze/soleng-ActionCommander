'use strict'

const Bus = require('electron-eventbus');
const eventBus = new Bus();


function connectivityCheck() {};
//------------------------------------------------------------------------------------
connectivityCheck.prototype.checkConnectivity = function(json, callback) {
	const fuzeListener = require('../js/fuzelistener');
	const endPointValidate = require('../js/validateEndPoint');
	var retObj = JSON.parse('{ "code": 200 }');
	fuzeListener.startSocket(function(startObj) {
		retObj = startObj;
		if (startObj.code == 200) {
			console.warn("checkConnectivity: Started Socket" + JSON.stringify(startObj));
			fuzeListener.stopSocket(function(stopObj) {
				if (startObj.code == 200) {
					endPointValidate.validateEndPoint(function(epObj) {
						if(epObj.code == 200) {
							console.warn("CheckConnectivity: Validate End Point Success" + JSON.stringify(epObj));
							eventBus.emit(epObj.action, epObj);
							retObj = epObj;
						} else {
							console.warn("CheckConnectivity: Validate End Point Failed Socket" + JSON.stringify(epObj));
							eventBus.emit(epObj.action, epObj);
							retObj = epObj;
							callback(epObj);
						}
					});
				} else {
					console.warn("Check Connectivity: Socket Close Failed" + JSON.stringify(stopObj));
					eventBus.emit(stopObj.action, stopObj);	
					retObj = stopObj;
				}
			});
		} else {
			console.warn("Check Connectivity: Socket Open Failed" + JSON.stringify(startObj));
			eventBus.emit(startObj.action, startObj);
			retObj = JSON.parse('{ "code": 401 }');;	
		}
	});	
	callback(retObj);
}

module.exports = new connectivityCheck();
