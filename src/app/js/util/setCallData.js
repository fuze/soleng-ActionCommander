'use strict';

const bg = require('../generalSetGet')
const ph = require('../util/phoneUtils')
const ch = require('../util/callHistory')

exports.setCallData = function (callstate, json) {
	console.log('setCallData: callState == ' + callstate);
	console.log('setCallData: callData == ' + JSON.stringify(json, null, 2));

	bg.setFormattedCallID(json.clid);
	bg.setCallIdforUI(json.clid);
	bg.setRawCallId(json.clid);
	bg.setRawStartTime(json.timestamp);
	bg.setContactRole('Searching');

	if (callstate == 'RING') {
		bg.setHistoryFlag(true);
		if (JSON.parse(json.ringback)) {
			console.log("setCallData: (!JSON.parse(json.ringback) ");
			bg.setCallDirection("OUTBOUND");
			bg.setFormattedCallID(json.callid);
			console.log("setCallData: Destination number == " + json.clid);
			console.log("setCallData: Destination number == " + json.destnumber);
			bg.setCallIdforUI(json.callid);
			bg.setRawCallId(json.callid);
			if (json.destname !== undefined) {
				console.log("setCallData: Destination name == " + json.destname);
			 	bg.setCallerName(json.destname);
			} else {
				bg.setCallerName('Unknown');
			}
		} else {
			bg.setCallDirection(json.direction);
			if (json.direction == "OUTBOUND") {
				bg.setRawCallId(json.destnumber);
				bg.setFormattedCallID(json.destnumber);
				bg.setCallIdforUI(json.destnumber);
				bg.setRawCallId(json.destnumber);
			}
			if (json.clidname !== undefined) {
				bg.setCallerName(json.clidname);
			} else {
				bg.setCallerName('Unknown');
			}
		}

	} else if (callstate == 'DIAL') {
		bg.setRawCallId(json.destnumber);
		if (json.destinationName !== undefined) {
			bg.setCallerName(json.destnumber);

		} else {
			bg.setCallerName('Unknown');
		}
	} //else if (callstate == 'CALL_END') {
		//ch.createCallHistory(json);
	//}
	bg.setCallState(callstate);
}
