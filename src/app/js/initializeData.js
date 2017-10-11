'use strict'

const settings = require('../js/usersettings');
const userhandler = require('../js/handleUserData');
const reset = require('../js/util/resetBackGroundData');

window.onload = function () {
	console.debug("initialize Data: in window.onload " + 'bbbb');
	reset.resetBackGroundData();
	settings.getUserSettings(function(json) {
		console.debug("initialize Data: in window.onload " + JSON.stringify(json, null, 2));
		userhandler.userDataHandler(json, function(obj) {
			console.warn("Initialize Data " + obj);
		});
	});
}
