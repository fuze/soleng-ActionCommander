'use strict'

const settings = require('../js/usersettings');
const mainWindow = remote.getGlobal('mainWindow')
const pjson = remote.getGlobal('pjson')

window.onload = function () {
	console.debug("initialize Data: in window.onload " + 'bbbb');
	settings.resetSettings(function(json) {
		//__dirname = __dirname.substring(0, __dirname.lastIndexOf('/'));
		var url = pjson.config.loginurl;
		var url = url.substring(url.indexOf('/')+1);

		mainWindow.loadURL(`file://${__dirname}/../${url}`, {})
	});
}
