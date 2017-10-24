'use strict'

const remote = require('electron').remote;
const mainWindow = remote.getGlobal('mainWindow')

const lc = require('./localConfigSettings');
const ph = require('./util/phoneUtils')
const moment = require('./util/moment-timezone-with-data');

function backgroundSettings() {};
////////////////////////////////////////////////////////////////////////////////////////
// Call answered
backgroundSettings.prototype.getIsCallAnswered = function () {
    return localStorage.getItem('isCallAnswered');

}
backgroundSettings.prototype.setIsCallAnswered = function(isCallAnswered) {
    console.log("isCallAnswered: " + isCallAnswered);
    localStorage.setItem('isCallAnswered', isCallAnswered);
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Auth Status 
backgroundSettings.prototype.getCrmAuthStatus = function() {
    return JSON.parse(localStorage.getItem('crmauthstatus'));
}
backgroundSettings.prototype.setCrmAuthStatus = function(crmauthstatus) {
	console.log("crmauthstatus: " + crmauthstatus);
	
	if(crmauthstatus == 0) {
		this.setCrmAuthMessage('Not Authorized');
	} else {
		this.setCrmAuthMessage('Authorized');
	}
	
	var previousCrmAuthStatus = this.getCrmAuthStatus();
    localStorage.setItem('crmauthstatus', crmauthstatus);
    if (crmauthstatus != previousCrmAuthStatus) {
    	mainWindow.webContents.send('crmauthstatus',crmauthstatus);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// CRM Auth Status 
backgroundSettings.prototype.getCrmAuthMessage = function() {
    return localStorage.getItem('crmauthmessage');
}
backgroundSettings.prototype.setCrmAuthMessage = function(crmauthmessage) {
console.log("crmauthmessage: " + crmauthmessage);		
 	var previousCrmAuthMessage = this.getCrmAuthMessage();
    localStorage.setItem('crmauthmessage', crmauthmessage);
    if (crmauthmessage != previousCrmAuthMessage) {
    	mainWindow.webContents.send('crmauthmessage' , crmauthmessage);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// Code for note Codes
backgroundSettings.prototype.getWrapUpValue = function() {
    return localStorage.getItem('notecode');
}

backgroundSettings.prototype.setWrapUpValue = function(codevalue) {
	console.log("setupSetGet: setWrapUpValue notecode: " + codevalue);
	
    localStorage.setItem('notecode', codevalue);
}

////////////////////////////////////////////////////////////////////////////////////////
// Call Notes
backgroundSettings.prototype.getNoteValue = function() {
    return localStorage.getItem('notenotes');
}
backgroundSettings.prototype.setNoteValue = function(notenotes) {
console.log("setupSetGet: setNoteValue notenotes: " + notenotes);
	if (notenotes) { 
		notenotes = notenotes.replace(/(\r\n|\n|\r)/gm,"\\r\\n");
	}
    localStorage.setItem('notenotes', notenotes);
}


////////////////////////////////////////////////////////////////////////////////////////
// getUnSubscribeID/setUnSubscribeID
// This is used to get/set the sockets subscription value upon a successful subscription
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
backgroundSettings.prototype.getUnSubscribeID = function() {
    return localStorage.getItem('unsubscribeid');
}
backgroundSettings.prototype.setUnSubscribeID = function(unsubscribeid) {
console.log("unsubscribeid: " + unsubscribeid + " " + this.getFormattedDate('mdy'));
    var previousUnSubscribeID = this.getUnSubscribeID();
    localStorage.setItem('unsubscribeid', unsubscribeid);
    if (unsubscribeid != previousUnSubscribeID) {
    	mainWindow.webContents.send('unsubscribeid' , unsubscribeid);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// getSocketMessage/getSocketMessage
// This is used to get/set the sockets status message 
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getSocketMessage = function () {
    return localStorage.getItem('socketmessage');
}
backgroundSettings.prototype.setSocketMessage = function (socketmessage) {
console.log("setSocketMessage: " + socketmessage);
    var previousSocketMessage = this.getSocketMessage();
    localStorage.setItem('socketmessage', socketmessage);
    if (socketmessage != previousSocketMessage) {
    	mainWindow.webContents.send('socketmessage' , socketmessage);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// getSocketStatus/setSocketStatus
// This is used to get/set the sockets status as a 1 == true, 0 == false
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
backgroundSettings.prototype.getSocketStatus = function() {
	
    return JSON.parse(localStorage.getItem('socketstatus'));
}

backgroundSettings.prototype.setSocketStatus = function(socketstatus) {
console.log("setSocketStatus: " + socketstatus);
    var previousSocketStatus = this.getSocketStatus();
    localStorage.setItem('socketstatus', socketstatus);
    if (socketstatus != previousSocketStatus) {
    	mainWindow.webContents.send('socketstatus' , socketstatus);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// getCallerFirstName/setCallerFirstName
// This is used to get/set the Caller's First Name
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getCallerFirstName = function() {
    return localStorage.getItem('callerfirstname');
}
backgroundSettings.prototype.setCallerFirstName = function(callerfirstname) {
console.log("callerfirstname: " + callerfirstname );
    localStorage.setItem('callerfirstname', callerfirstname);
}

////////////////////////////////////////////////////////////////////////////////////////
// getCallerLastName/setCallerLastName
// This is used to get/set the Caller's First Name
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getCallerLastName = function() {
    return localStorage.getItem('callerlastname');
}
backgroundSettings.prototype.setCallerLastName = function(callerlastname) {
console.log("setcallerlastname: " + callerlastname);
    localStorage.setItem('callerlastname', callerlastname);;
}


////////////////////////////////////////////////////////////////////////////////////////
// getCallState/setCallState
// This is used to get/set the Call State, e.g. DIAL, RING, CONNECT, HANGUP, END_CALL, etc.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getCallState = function() {
    return localStorage.getItem('callstate');
}
backgroundSettings.prototype.setCallState = function(callstate) {
console.log("callstate: " + callstate);
    var previousCallState = this.getCallState();
    localStorage.setItem('callstate', callstate);
    if (callstate != previousCallState) {
    	mainWindow.webContents.send('callstate',callstate);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getFormattedCallID/setFormattedCallID
// This is used to get/set the formatted telephone number for the raw number from the socket.
// see getFormattedPhoneNumber in this file
//===================================================================================//
backgroundSettings.prototype.getFormattedCallID = function() {
    return localStorage.getItem('fmtcallid');
}
backgroundSettings.prototype.setFormattedCallID = function(fmtcallid) {
	var num = ph.getFormattedPhoneNumber(fmtcallid);
	console.log("fmtcallid: " + num);
    localStorage.setItem('fmtcallid', num);
}

////////////////////////////////////////////////////////////////////////////////////////
// getE164CallID/setE164CallID
// This is used to get/set the formatted telephone number for the raw number from the socket.
// see getFormattedPhoneNumber in this file
//===================================================================================//
backgroundSettings.prototype.getCallIdforUI = function() {
	return localStorage.getItem('UIcallid');
}
backgroundSettings.prototype.setCallIdforUI = function(UIcallid) {
	console.log("UIcallid: " + UIcallid);
	var num = ph.getPhoneNumberForUI(UIcallid);
	console.log("UIcallid: " + num);
	localStorage.setItem('UIcallid', num);
}

////////////////////////////////////////////////////////////////////////////////////////
// getCallerName/getCallerName
// This is used to get/set the caller's name.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getCallerName = function() {
    return localStorage.getItem('callername');
}
backgroundSettings.prototype.setCallerName = function(callername) {
	console.log("callername: " + callername);

	var fullName;
	if (callername.indexOf(',') > -1) {
console.log("setCallerName callername : " + callername);
		var name = callername.split(',');
		this.setCallerFirstName(name[1]);
		this.setCallerLastName(name[0]);
		fullName = name[1] + " " + name[0];
	} else if (callername.indexOf(' ') > -1) {
		var name = callername.split(' ');
		fullName = name[0] + " " + name[1];
		this.setCallerFirstName(name[1]);
		this.setCallerLastName(name[0]);
		fullName = name[0] + " " + name[1];
	} else {
		fullName = callername;
	}
	localStorage.setItem('callername', fullName);

	if (!fullName.match(/getCallerName()/g)) {
    	mainWindow.webContents.send('callername', fullName);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getAnchorTableData/setAnchorTableData
// This is used to get/set the data for the Anchor table.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getAnchorTableData = function() {
    return localStorage.getItem('anchortable');
}

backgroundSettings.prototype.setAnchorTableData = function(anchortable) {

    var previousAnchorTable = this.getAnchorTableData();
    localStorage.setItem('anchortable', anchortable);

    if ((anchortable != previousAnchorTable) && (anchortable !== false)) {
    	mainWindow.webContents.send('anchortable', anchortable);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getContentTableData/setContentTableData
// This is used to get/set the data for the content table .
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getContentTableData = function() {
    return localStorage.getItem('contenttable');
}
backgroundSettings.prototype.setContentTableData = function(contenttable) {
 var previousContentTableData = this.getContentTableData();
    localStorage.setItem('contenttable', contenttable);
   if ((contenttable != previousContentTableData) && (contenttable !== false)) {
   		mainWindow.webContents.send('contenttable', contenttable);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getStarttime/setStarttime
// This is used to get/set the direction of the start time of the call based on the timeStamp
// as seen by the socket.
//===================================================================================//
backgroundSettings.prototype.getStarttime = function() {
    return localStorage.getItem('starttime');
}
backgroundSettings.prototype.setStarttime = function(fmt) {
	console.log("starttime: fmt " + fmt);

	var starttime;
	if (fmt) {
		starttime = this.getFormattedDate(fmt);
	} else {
		starttime = fmt
	}
console.log("starttime: " + starttime);
    localStorage.setItem('starttime', starttime);
}

////////////////////////////////////////////////////////////////////////////////////////
// getFormattedDate
// return the formatted date for a given timestamp
// * This needs to be rewritten for Internationalization
//===================================================================================//
backgroundSettings.prototype.getFormattedDate = function(fmt) {
   var d = new Date();
   if (fmt == 'mdy') {
         d = ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + "-" + d.getFullYear() + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
    } else if (fmt == 'ymd') {
      d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
    } else if (fmt == 'history') {
    	d = ('0' + (d.getMonth() + 1)).slice(-2) + "/" + ('0' + d.getDate()).slice(-2) + "/" + d.getFullYear() + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);
    } else if (fmt == 'date') {
	   d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);
    }

    return d;
}

backgroundSettings.prototype.formatDate = function(timestamp) {

	var tzName = moment.tz.guess();
	var m = moment();
	var fmtDate = m.tz(tzName).format('MM-DD-YYYY');

	return fmtDate;
}

////////////////////////////////////////////////////////////////////////////////////////
// getRawEndTime/setRawEndTime
// This is used to get/set the timestamp of the call start
//===================================================================================//
backgroundSettings.prototype.getRawEndTime = function() {
    return localStorage.getItem('rawendtime');
}
backgroundSettings.prototype.setRawEndTime = function(rawendtime) {
console.info("rawendtime: " + rawendtime);
    localStorage.setItem('rawendtime', rawendtime);
}

////////////////////////////////////////////////////////////////////////////////////////
// getRawStartTime/setRawStartTime
// This is used to get/set the timestamp of the call start
//===================================================================================//
backgroundSettings.prototype.getRawStartTime = function() {
    return localStorage.getItem('rawtime');
}
backgroundSettings.prototype.setRawStartTime = function(rawtime) {
console.info("rawtime: " + rawtime);
    localStorage.setItem('rawtime', rawtime);
}

////////////////////////////////////////////////////////////////////////////////////////
// getCallDirection/setCallDirection
// This is used to get/set the direction of the call as seen by the socket.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
// * This needs to be rewritten to ensure that the format is appropriate for i18n
//===================================================================================//
backgroundSettings.prototype.getCallDirection = function() {
    return localStorage.getItem('calldirection');
}
backgroundSettings.prototype.setCallDirection = function(calldirection) {
	console.warn("calldirection: " + calldirection);

	if (calldirection == 'INBOUND') {
		calldirection = 'Inbound';
	} else if (calldirection == 'OUTBOUND') {
		calldirection = 'Outbound';
	} else {
		calldirection = 'Unknown';
	}

	var previousCallDirection = this.getCallDirection();
    localStorage.setItem('calldirection', calldirection);

	if ((calldirection != previousCallDirection) && (calldirection !== false)) {
		mainWindow.webContents.send('calldirection', calldirection);
    }

}

////////////////////////////////////////////////////////////////////////////////////////
// getAnchorTheadData/setAnchorTheadData
// This is used to get/set the data for the Anchor table.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getAnchorTheadData = function() {
    return localStorage.getItem('anchorhead');
}

backgroundSettings.prototype.setAnchorTheadData = function(anchorhead) {
console.log("setAnchorTheadData : " + anchorhead);
    var previousAnchorThead = this.getAnchorTheadData();
    localStorage.setItem('anchorhead', anchorhead);

    if ((anchorhead != previousAnchorThead) && (anchorhead !== false)) {
    	mainWindow.webContents.send('anchorhead', anchorhead);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getAnchorTableData/setAnchorTableData
// This is used to get/set the data for the Anchor table.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getAnchorTableData = function() {
    return localStorage.getItem('anchortable');
}

backgroundSettings.prototype.setAnchorTableData = function(anchortable) {
console.log("setAnchorTableData : " + anchortable);
    var previousAnchorTable = this.getAnchorTableData();
    localStorage.setItem('anchortable', anchortable);

    if ((anchortable != previousAnchorTable) && (anchortable !== false)) {
    	mainWindow.webContents.send('anchortable', anchortable);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// getContentTableData/setContentTableData
// This is used to get/set the data for the content table .
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getContentTheadData = function() {
    return localStorage.getItem('contentthead');
}
backgroundSettings.prototype.setContentTheadData = function(contentthead) {
 var previousContentTheadData = this.getContentTheadData();
    localStorage.setItem('contentthead', contentthead);
   if ((contentthead != previousContentTheadData) && (contentthead !== false)) {
    	mainWindow.webContents.send('contentthead', contentthead);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
// getContentTableData/setContentTableData
// This is used to get/set the data for the content table .
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getContentTableData = function() {
    return localStorage.getItem('contenttable');
}
backgroundSettings.prototype.setContentTableData = function(contenttable) {
 var previousContentTableData = this.getContentTableData();
    localStorage.setItem('contenttable', contenttable);
   if ((contenttable != previousContentTableData) && (contenttable !== false)) {
    	mainWindow.webContents.send('contenttable', contenttable);
    }
}
////////////////////////////////////////////////////////////////////////////////////////
// getUserConnectorAcct/setUserConnectorAcct
// This is used to get/set the Contact ID this is used to when and if an contact
// is clicked and/or determine if the callnotes, wrap codes and call log can be related
// to the "Contact"
//===================================================================================//
backgroundSettings.prototype.getUserConnectorAcct = function() {
    return localStorage.getItem('conuid');
}
backgroundSettings.prototype.setUserConnectorAcct = function(conuid) {
	console.log("conuid: " + conuid);
    localStorage.setItem('conuid', conuid);
}

////////////////////////////////////////////////////////////////////////////////////////
// getAcctConnectorID/setAcctConnectorID
// This is used to get/set the Account ID this is used to when and if an account
// is clicked and/or determine if the callnotes, wrap codes and call log can be related
// to the "Account"
//===================================================================================//
backgroundSettings.prototype.getAcctConnectorID = function() {
    return localStorage.getItem('conacctid');
}
backgroundSettings.prototype.setAcctConnectorID = function(conacctid) {
	console.log("conacctid: " + conacctid);
    localStorage.setItem('conacctid', conacctid);
}

////////////////////////////////////////////////////////////////////////////////////////
// getActivityId/setActivityId
// This is used to get/set the activity ID (activity/incident/etc) this is used to
// determine if something has been selected, so that the callnotes, wrap codes and call log
// can be related to the "activity"
//===================================================================================//
backgroundSettings.prototype.getActivityId = function() {
    return localStorage.getItem('actid');
}
backgroundSettings.prototype.setActivityId = function(actid) {
	console.log("actid: " + actid);
    localStorage.setItem('actid', actid);
}

///////////////////////////////////////////////////////////////////////////////////////
// getRawCallId/setRawCallId
// This is used to get/set the RAW Caller ID Number that is received by the socket
//===================================================================================//
backgroundSettings.prototype.getRawCallId = function() {
    return localStorage.getItem('rawcallid');
}
backgroundSettings.prototype.setRawCallId = function(rawcallid) {
	console.log("rawcallid: " + rawcallid);

	console.log("rawcallid: " + rawcallid);
    localStorage.setItem('rawcallid', rawcallid);
}

///////////////////////////////////////////////////////////////////////////////////////
// getCallIdFromSocket/setCallIdFromSocket
// This is used to get/set the callId that is received by the socket
// This used as part of the Call Recording Link.
//===================================================================================//
backgroundSettings.prototype.getCallIdFromSocket = function() {
    return localStorage.getItem('jsoncallid');
}
backgroundSettings.prototype.setCallIdFromSocket = function(jsoncallid) {
	console.log("jsoncallid: " + jsoncallid);
    localStorage.setItem('jsoncallid', jsoncallid);
}

////////////////////////////////////////////////////////////////////////////////////////
// timeConverter
// Converts Time Stamp to Human Readable time
// * This needs to be rewritten to ensure that the format is appropriate for i18n
//===================================================================================//
backgroundSettings.prototype.timeConverter = function(timeStamp) {
	var a = new Date(timeStamp * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	//var time = month + ' ' + date + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
	var time = month + ' ' + date + ' ' + year + ' ' + hour + ':' + min  ;
  	return time;
}

////////////////////////////////////////////////////////////////////////////////////////
// getContactLeadId/setContactLeadId
// This is used to set the Contact or Lead ID e.g. in vTiger there are Contact and Leads
// so that the screen pop or updates are sent to the correct contact/lead.
// This is used by and for all integrations.
//===================================================================================//
backgroundSettings.prototype.getContactLeadId = function() {

    return localStorage.getItem('cntleadid');
}
backgroundSettings.prototype.setContactLeadId = function(cntleadid) {
	console.log("cntleadid: " + cntleadid);
    localStorage.setItem('cntleadid', cntleadid);
}

////////////////////////////////////////////////////////////////////////////////////////
// getContactLeadId/setContactLeadId
// This is used to set the Contact or Lead Type e.g. in vTiger there are Contact and Leads
// that are displayed
//===================================================================================//
backgroundSettings.prototype.getContactLeadType = function() {
    return localStorage.getItem('cntleadtype');
}
backgroundSettings.prototype.setContactLeadType = function(cntleadtype) {
	console.log("cntleadtype: " + cntleadtype);
    localStorage.setItem('cntleadtype', cntleadtype);
}

////////////////////////////////////////////////////////////////////////////////////////
// getContactRole/setContactRole
// This is a ui backgroundSettings.prototype.that gets the Role for the COntact and displays it under the name
// in the UI
//===================================================================================//
backgroundSettings.prototype.getContactRole = function() {
    return localStorage.getItem('contactrole');
}
backgroundSettings.prototype.setContactRole = function(contactrole) {
	console.log("contactrole: " + contactrole);
	if (contactrole === undefined) {
    	contactrole = '';
    }
    localStorage.setItem('contactrole', contactrole) 
    mainWindow.webContents.send('contactrole', contactrole);
}

////////////////////////////////////////////////////////////////////////////////////////
// getHistoryFlag/setHistoryFlag
// When Notes and/or Wrapup codes are enabled there is a possibility that the call gets
// entered into the history twice, this setting and clearing this flag ensure that there
// is a single entry
//===================================================================================//
backgroundSettings.prototype.getHistoryFlag = function() {
    return localStorage.getItem('historyFlag');
}
backgroundSettings.prototype.setHistoryFlag = function(historyFlag) {
	console.log("historyFlag: " + historyFlag);
    localStorage.setItem('historyFlag', historyFlag);
   	 mainWindow.webContents.send('historyFlag', historyFlag);
}
////////////////////////////////////////////////////////////////////////////////////////
// getCurrentCall/setCurrentCall
// This is used to get/set the Call(s) that the user may be on
// This will be an array of values
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
// This needs to be turned into a list of calls so someone can answer a call and
// return to the previous call
//
backgroundSettings.prototype.getCurrentCall = function() {
	return localStorage.getItem('currentcall');
}

backgroundSettings.prototype.setCurrentCall = function(callId) {
console.log("__setCurrentCall == " + callId);
	localStorage.setItem('currentcall', callId);
}
////////////////////////////////////////////////////////////////////////////////////////
// getCallList/setCallList
// This is used to get/set the Call(s) that the user may be on
// This will be an array of values
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- cnt.uiInteractions.js
//===================================================================================//
// This needs to be turned into a list of calls so someone can answer a call and
// return to the previous call
//
backgroundSettings.prototype.getCallList = function () {
	/*
	console.log("__getCallList typeof == " + typeof callId);
	if (typeof callId === undefined) {
		var array = localStorage.getItem('calllist');
		console.log("__getCallList array == " + array);
		if (array == callId) {
			console.log("__getCallList returning == " + callId);
			return callid;
		} else {
			console.log("__getCallList returning == " + false);
			return false;
		}
	} else {
		console.log("__getCallList undefined else returning == " + false);
		return localStorage.getItem('calllist');
	}
	*/
	return localStorage.getItem('calllist');
}

backgroundSettings.prototype.setCallList = function(callId) {
console.log("__setCallList == " + callId);
	if (!callId) {
		 localStorage.setItem('calllist', false);
	} else if (callId) {
		localStorage.setItem('calllist', callId);
	}
}


////////////////////////////////////////////////////////////////////////////////////////
// getCreateNewString
// return the string for the create new entity
//===================================================================================//
backgroundSettings.prototype.getCreateNewString = function() {

	var newString = "New...";

	if (lc.getContentPrimary() == 'activities') {
		newString = "New Activity..."
	} else if (lc.getContentPrimary() == 'opportunities') {
		newString = "New Opportunity..."
	} else if (lc.getContentPrimary() == 'job-orders') {
		newString = "New Job..."
	} else if (lc.getContentPrimary() == 'tasks') {
		newString = "New Task..."
	} else if (lc.getContentPrimary() == 'incidents') {
		newString = "New Incident..."
	}

	return newString;
}



module.exports = new backgroundSettings();
