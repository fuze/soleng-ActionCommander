'use strict'


// Spans
var connectionStatus 	= document.getElementById('connection-status');
var connectionConnect 	= document.getElementById('connection-status-connect');
var connectionError 	= document.getElementById('connection-status-error');
var connectionMessage 	= document.getElementById('connection-message');
var connectionStatusOK 	= document.getElementById('connectStatus-OK');
var connectionStatusErr	= document.getElementById('connectStatus-Error');


ipcRenderer.on('contents-loaded', (event, arg) => {
  console.info(arg) // prints "pong"

// window.onload = function() {
console.info("_onLoad: Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );
	
	connectionError.style.visibility = "hidden";
	connectionConnect.style.visibility = "hidden";
	connectionMessage.style.visibility = "hidden";
	connectionStatusOK.style.visibility = "hidden";
	connectionStatusErr.style.visibility = "hidden";
	
	_displayStaus();
	document.title = 'Fuze Connect ' + lc.getConnectorName();
})
//}

////////////////////////////////////////////////////////////////////////////////////////////////////
function _displayStaus() {
console.info("_displayStatus: Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );



	if ( (bg.getSocketStatus() === true) && (bg.getCrmAuthStatus()  === true)) {
console.info("_displayStatusBoth = 1 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Waiting for a call...";

		connectionConnect.style.visibility = "hidden";
		connectionError.style.display = "none";
		connectionConnect.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "visible";
		connectionStatusErr.style.visibility = "hidden";

	} else if ( (bg.getSocketStatus() === false ) && (bg.getCrmAuthStatus() === true)) {
console.log("_displayStatusSocket 0 - CRM 1 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Waiting for Socket Start ...";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	} else if ( (bg.getSocketStatus() === true) && (bg.getCrmAuthStatus() === false )) {
console.log("_displayStatus Socket 1 CRM 0 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = lc.getConnectorName() + " Failed Authorization";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	} else {
console.log("_displayStatus Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Contact Fuze Support";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	}
}

ipcRenderer.on('socketstatus', (event, arg) => {
	console.info("cnt.status contactrole") 
	_displayStaus();
});

ipcRenderer.on('crmauthstatus', (event, arg) => {
	console.info("cnt.uiInteractions socketstatus") 
	_displayStaus();
});



