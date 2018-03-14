"use strict";

function backgroundSettings() {}

////////////////////////////////////////////////////////////////////////////////////////
// getUnSubscribeID/setUnSubscribeID
// This is used to get/set the sockets subscription value upon a successful subscription
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
backgroundSettings.prototype.getUnSubscribeID = function() {
  return localStorage.getItem("unsubscribeid");
};
backgroundSettings.prototype.setUnSubscribeID = function(unsubscribeid) {
  console.log(
    "unsubscribeid: " + unsubscribeid + " " + this.getFormattedDate("mdy")
  );
  var previousUnSubscribeID = this.getUnSubscribeID();
  localStorage.setItem("unsubscribeid", unsubscribeid);
  if (unsubscribeid != previousUnSubscribeID) {
    // TODO 
  }
};
////////////////////////////////////////////////////////////////////////////////////////
// getSocketMessage/getSocketMessage
// This is used to get/set the sockets status message
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js or cnt.uiInteractions.js
//===================================================================================//
backgroundSettings.prototype.getSocketMessage = function() {
  return localStorage.getItem("socketmessage");
};
backgroundSettings.prototype.setSocketMessage = function(socketmessage) {
  console.log("setSocketMessage: " + socketmessage);
  var previousSocketMessage = this.getSocketMessage();
  localStorage.setItem("socketmessage", socketmessage);
  if (socketmessage != previousSocketMessage) {
    //TODO 
  }
};

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
// getCallDirection/setCallDirection
// This is used to get/set the direction of the call as seen by the socket.
// Once Set it emits an event so the event listener can perform approiat actions, e.g.
// Change the UI -- cnt.uiInteractions.js
// * This needs to be rewritten to ensure that the format is appropriate for i18n
//===================================================================================//
backgroundSettings.prototype.getCallDirection = function() {
  return localStorage.getItem("calldirection");
};
backgroundSettings.prototype.setCallDirection = function(calldirection) {
  console.warn("calldirection: " + calldirection);

  if (calldirection == "INBOUND") {
    calldirection = "Inbound";
  } else if (calldirection == "OUTBOUND") {
    calldirection = "Outbound";
  } else {
    calldirection = "Unknown";
  }

  var previousCallDirection = this.getCallDirection();
  localStorage.setItem("calldirection", calldirection);

  if (calldirection != previousCallDirection && calldirection !== false) {
    // TODO
  }
};

///////////////////////////////////////////////////////////////////////////////////////
// getCallIdFromSocket/setCallIdFromSocket
// This is used to get/set the callId that is received by the socket
// This used as part of the Call Recording Link.
//===================================================================================//
backgroundSettings.prototype.getCallIdFromSocket = function() {
  return localStorage.getItem("jsoncallid");
};
backgroundSettings.prototype.setCallIdFromSocket = function(jsoncallid) {
  console.log("jsoncallid: " + jsoncallid);
  localStorage.setItem("jsoncallid", jsoncallid);
};

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
  return localStorage.getItem("currentcall");
};

backgroundSettings.prototype.setCurrentCall = function(callId) {
  console.log("__setCurrentCall == " + callId);
  localStorage.setItem("currentcall", callId);
};
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
backgroundSettings.prototype.getCallList = function() {
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
  return localStorage.getItem("calllist");
};

backgroundSettings.prototype.setCallList = function(callId) {
  console.log("__setCallList == " + callId);
  if (!callId) {
    localStorage.setItem("calllist", false);
  } else if (callId) {
    localStorage.setItem("calllist", callId);
  }
};

module.exports = new backgroundSettings();
