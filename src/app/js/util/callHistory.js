'use strict'

const remote = require('electron').remote;
const mainWindow = remote.getGlobal('mainWindow')
const bg = require('../generalSetGet')

function callHistory() {};

////////////////////////////////////////////////////////////////////////////////////////
callHistory.prototype.createCallHistory = function() {
	var phone;
	var name = bg.getCallerName() || 'Unknown';
	var number = bg.getCallIdforUI();
	

	
	if (bg.getCallIdforUI() != 'false') {
		console.log("createCallHistory: != false bg.getCallerName() " + bg.getCallerName());
		console.log("createCallHistory: != false bg.getCallIdforUI() " + bg.getCallIdforUI());
		console.log("createCallHistory: != false name " + name);
		console.log("createCallHistory: != false number " + number);
	}
	
	
	if ((bg.getCallIdforUI() != 'false') || (bg.getCallIdforUI() !== false) || (bg.getCallIdforUI())) {
		if (bg.getCallDirection() == 'Inbound') {
			phone = '</span><img class=\\"call-direction-arrow\\" src=\\"../images/arrow-in.png\\"> ' + bg.getCallIdforUI();
		} else if (bg.getCallDirection() == 'Outbound') {
			phone = '</span><img class=\\"call-direction-arrow\\" src=\\"../images/arrow-out.png\\"> ' + bg.getCallIdforUI();
		} else {
			phone = '</span><img class=\\"call-direction-arrow\\" src=\\"../images/arrow-in.png\\">'
			phone += '<img class=\\"call-direction-arrow\\" src=\\"/images/arrow-out.png\\"> ' + bg.getCallIdforUI();
		}
		
		var cHistory = '{ "name" : "' + bg.getCallerName() +'", ';
		cHistory += '"phone" : "' +  phone +'", ';
		cHistory += '"rawphone" : "' +  bg.getRawCallId().replace('+','') +'", ';
		cHistory += '"datetime" : "' +  bg.getFormattedDate('history') +'" }';
		this.setCallHistory(cHistory);
	}
}

////////////////////////////////////////////////////////////////////////////////////////
var _callHistory = [];
callHistory.prototype.getCallHistory = function () {
    var value = localStorage.getItem('callhistory');
    return value && JSON.parse(value); 
}
////////////////////////////////////////////////////////////////////////////////////////
callHistory.prototype.setCallHistory = function (historyitem) {
	console.log("setCallHistory: callhistory: " + historyitem);
	if (bg.getHistoryFlag) {
		bg.setHistoryFlag(false);
		var history = JSON.parse(historyitem);
		var allHistory;
	
		if ((history.name !== undefined) && (history.name !== false)) {
			if(history != 'false') {
				if(this.getCallHistory() !== null) {
					allHistory = this.getCallHistory();
					allHistory.push(history);
				} else {
					allHistory.push(history);
				}
			}
			localStorage.setItem('callhistory', JSON.stringify(allHistory));
		} 
		mainWindow.webContents.send('callhistory' , allHistory);
		
    }
}		

module.exports = new callHistory();
