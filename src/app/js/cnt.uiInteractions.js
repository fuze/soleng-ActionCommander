'use strict'

const uh = require('./utilityHandler');
// Outgoing Call Div
var callcontrols			= document.getElementById('callcontrols');
var outgoingMainDiv			= document.getElementById('outgoing-main-div');
var outgoingMainTitle		= document.getElementById('outgoing-main-title');
var outgoingMainName		= document.getElementById('outgoing-name');
var outgoingMainOrg			= document.getElementById('outgoing-org');
var outgoingMainPhone		= document.getElementById('outgoing-phone');
var outgoingAvatar			= document.getElementById('outgoing-avatar');
var outgoingMiddleDiv		= document.getElementById('outgoing-middle-div');
var outgoingInsghtDate		= document.getElementById('outgoing-insights-date');
var outgoingInsghtTitle		= document.getElementById('outgoing-insights-title');
var outgoingInsghtNote		= document.getElementById('outgoing-insights-note');
var outgoingBottomDiv		= document.getElementById('outgoing-bottom-div');
var outgoingNoteSave		= document.getElementById('outgoing-notesfield-save');
var newContactLink			= document.getElementById("new-contact-link");

var generalRingBox			= document.getElementById('caller-info-child-right');
var generalClockText		= document.getElementById("ringing-box");

// Incoming Call Div
var incomingMainDiv 		= document.getElementById('incoming-main-div');
var incomingMainStatus		= document.getElementById('incoming-main-status');
var incomingMainPhone		= document.getElementById('incoming-main-phone');
var incomingMainName		= document.getElementById('incoming-main-name');
var incomingMainTitle		= document.getElementById('incoming-main-title');
var incomingAnchorDiv		= document.getElementById('incoming-anchor-div');
var incomingAnchorTable		= document.getElementById('incoming-anchor-table');
var incomingAnchorThead		= document.getElementById('incoming-anchor-thead');
var incomingAnchorTbody		= document.getElementById('incoming-anchor-tbody');

var incomingContentDiv 		= document.getElementById('incoming-content-div');
var incomingContentTable 	= document.getElementById('incoming-content-table');
var incomingContentTitle    = document.getElementById('incoming-content-title');     
var incomingContentThead  	= document.getElementById('incoming-content-thead');
var incomingContentTbody  	= document.getElementById('incoming-content-tbody');

//Idle Container Stuff
var idleMainDiv 			= document.getElementById('idle-container');
var idleTextDiv				= document.getElementById('idletext');
var idleStatConnect			= document.getElementById('connection-status-connect');
var idleStatError			= document.getElementById('connection-status-error');
var idleStatMsg				= document.getElementById('connection-message');


// Call History Call Div
var callHistoryTopDiv		= document.getElementById('call-history-main-div');
var callHistoryMainDiv 		= document.getElementById('call-history-div');
var callHistoryTable 		= document.getElementById('call-history');
var callHistoryThead 		= document.getElementById('call-history-thead');
var callHistoryTbody 		= document.getElementById('call-history-tbody');

// Spans
var connectionStatus 	= document.getElementById('connection-status');
var connectionConnect 	= document.getElementById('connection-status-connect');
var connectionError 	= document.getElementById('connection-status-error');
var connectionMessage 	= document.getElementById('connection-message');
var connectionStatusOK 	= document.getElementById('connectStatus-OK');
var connectionStatusErr	= document.getElementById('connectStatus-Error');


// arrays of 'New' Button Elements
var anchorNewLinks = [];
var callState = 'END_CALL';

ipcRenderer.on('contents-loaded', (event, arg) => {
  console.info("cnt.uiInteractions");
	bg.setHistoryFlag(true);
	
	_displayStaus();
	document.title = 'Fuze Connect ' + lc.getConnectorName();
  
	setInitialState();
	
	_callHistoryChange(wrangleColsforEvents);
});

setInitialState();

////////////////////////////////////////////////////////////////////////////////////////
function adjustContentTable(table) {
	console.log("cnt.uiInteractions adjustContentTable" + table);
   // Set up the table selector and bodyCells selector
   //var $table = $('.activities-table'),
   var $table = $(table),
       $bodyCells = $table.find('tbody tr:first').children();
    console.log("cnt.uiInteractions adjustContentTable " + JSON.stringify($table));
    console.log("cnt.uiInteractions adjustContentTable " + JSON.stringify($bodyCells));

   // Create a variable which will hold an array containing the width of each column, based on the width of each cell in the first row of the table
   var colWidth;
   colWidth = $bodyCells.map(function() {
       return $(this).width();
   }).get();
 	console.log("cnt.uiInteractions adjustContentTable " + colWidth);
   // Set the width of each cell in the thead to match the width of that column's content
   $table.find('thead tr').children().each(function(i, x) {
       $(x).width(colWidth[i]);
   });   
}
////////////////////////////////////////////////////////////////////////////////////////
function setIdleView() {
	connectionMessage.style.visibility 		= "visible";
	idleMainDiv.style.visibility 			= "visible";
	idleMainDiv.style.display 				= "block";
	idleMainDiv.style.zIndex 				= "0";
	idleTextDiv.style.visibility			= "visible";
	idleTextDiv.style.display 				= "block";
	idleStatMsg.style.visibility 			= "visible";
	if (idleStatMsg.innerHTML.indexOf('Waiting') > -1 ) {
		idleStatConnect.setAttribute('visibility', "visible");
	} else {
		idleStatError.setAttribute('visibility', "visible");
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function setInitialState() {
	console.log("cnt.uiInteractions setInitialState");
	
	setIdleView();
	
	callHistoryTopDiv.style.visibility 			= "visible";
	callHistoryMainDiv.style.visibility 		= "visible";
	callHistoryTable.style.visibility 			= "visible";
	callHistoryThead.style.visibility 			= "visible";
	callHistoryTbody.style.visibility 			= "visible";
	
	generalRingBox.style.visibility 			= "hidden";
	generalClockText.style.visibility 			= "hidden";
	
	incomingMainDiv.style.visibility 			= "hidden";
	incomingAnchorDiv.style.visibility 			= "hidden";
	incomingAnchorTable.style.visibility 		= "hidden";
	incomingAnchorThead.style.visibility 		= "hidden";
	incomingAnchorTbody.style.visibility 		= "hidden";
	incomingContentDiv.style.visibility 		= "hidden";
	incomingContentTable.style.visibility 		= "hidden";
	incomingContentThead.style.visibility 		= "hidden";
	incomingContentTbody.style.visibility 		= "hidden";
	newContactLink.style.visibility 			= "hidden";
	
	incomingMainStatus.style.visibility 		= "hidden";
	incomingMainPhone.style.visibility 			= "hidden";
	incomingMainPhone.innerHTML 				= '';
	incomingMainName.style.visibility 			= "hidden";
	incomingMainTitle.style.visibility 			= "hidden";

	connectionError.style.visibility = "hidden";
	connectionConnect.style.visibility = "hidden";
	connectionMessage.style.visibility = "hidden";
	connectionStatusOK.style.visibility = "hidden";
	connectionStatusErr.style.visibility = "hidden";
	
	_displayStaus();
	document.title = 'Fuze Connect ' + lc.getConnectorName();
}
////////////////////////////////////////////////////////////////////////////////////////
function _callHistoryChange() {
	console.log("cnt.uiInteractions _callHistoryChange");
	var history = ch.getCallHistory();
	console.log("cnt.uiInteractions _callHistoryChange: " + JSON.stringify(history));
	if (history !== null ) {
		var history = ch.getCallHistory();
		var len = history.length;
		var maxHistory = 20;
		var pageSize = 8;
		var tablestr = '';
		var pages = len / pageSize;
console.log("cnt.uiInteractions _callHistoryChange length " + len + " pages" + pages );		
		callHistoryThead.innerHTML = "<tr><th>Contact</th><th>Phone</th><th>Date/Time</th></tr>";		
		
	
		for (var i = len - 1; ( i >= len - maxHistory && i >= 0); i--) {
			
			console.log("cnt.uiInteractions _callHistoryChange: start with i " + JSON.stringify(history[i]));
			if (history[i].phone != false) {
				if (history[i].contactId != false && history[i].contactId != null) {
					tablestr += '<tr><td action=\"openwindow\" type=\"contacts\" uid=' + history[i].contactId +  '>' + history[i].name + '</td>';
				} else {
					tablestr += '<tr><td type=\"contact\">' + history[i].name + '</td>';
				}
				tablestr += '<td action=\"clicktocall\" type=\"phone\"  phone=' + history[i].rawphone +  '>' + history[i].phone + '</td>';
				tablestr += '<td action=\"clicktocall\" type=\"phone\" phone=' + history[i].rawphone +  '>' + history[i].datetime + '</td></tr>';
			}			
		
		
		}
		//callHistoryTbody.setAttribute('innerHTML', tablestr);
		callHistoryTbody.innerHTML = tablestr;
	}
	wrangleColsforEvents();
	adjustContentTable(callHistoryTable)
}
////////////////////////////////////////////////////////////////////////////////////////
function wrangleColsforEvents() {

	var allcols = document.getElementsByTagName('td');
	var num = allcols.length;
	//console.log("wrangleColsforEvents Number of Elements == " + allcols.length);

	for (var col = 0; col <= allcols.length - 1; col++) {
		//console.log("cnt.uiInteractions wrangleColsforEvents: element == " + allcols[col].innerHTML);
		addEventToCol(allcols[col]);
	}
	
}

////////////////////////////////////////////////////////////////////////////////////////
function clickEvent() {
	var jsonString = {};
	//console.log("cnt.uiInteractions element == " + this.innerHTML);

	var action; 
	for (var att, at = 0, atts = this.attributes, n = atts.length; at < n; at++) {
		att = atts[at];
		if( atts[at].nodeName == 'action') {
			action = att.nodeValue;
		} else if ( att.nodeName == 'type') {
			jsonString[ "type" ] = att.nodeValue;
		} else if ( att.nodeName == 'uid') {
			jsonString[ "uid" ]  = att.nodeValue;
		} else if ( att.nodeName == 'acctid') {
			jsonString[ "acctid" ]  = att.nodeValue;
		} else if ( att.nodeName == 'ticketid') {
			jsonString[ "ticketid" ]  = att.nodeValue;
		} else if ( att.nodeName == 'contentid') {
			jsonString[ "contentid" ]  = att.nodeValue;
		} else if ( att.nodeName == 'phone') {
			jsonString[ "phone" ]  = att.nodeValue;
		} else if ( att.nodeName == 'subtype') {
			jsonString[ "subtype" ]  = att.nodeValue;
		}
	}
	uh.utilityActionController(action, jsonString);
	console.log("cnt.uiInteractions Action == " + action + "\n data == " + JSON.stringify(jsonString));
}
////////////////////////////////////////////////////////////////////////////////////////
function addEventToCol(col) {
	//console.log("cnt.uiInteractions Column == " + col.innerHTML);
	var jsonString = {};
	for (var att, i = 0, atts = col.attributes, n = atts.length; i < n; i++) {
		//console.log("cnt.uiInteractions number attrs == " + i);
		att = atts[i];
		if (att.nodeName) {
			//console.log("cnt.uiInteractions column == " + col.innerHTML);
			if ( att.nodeName == 'action') {
				//console.log("cnt.uiInteractions column ACTION== " + col.innerHTML);
				col.addEventListener('click', clickEvent, false);
				var action = att.nodeValue;
			} 
		}
		//console.log("cnt.uiInteractions Action == " + action + "\n data == " + JSON.stringify(jsonString));
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function insertAnchorThead(thead) {
console.log("cnt.uiInteractions insertAnchorThead json = " +  bg.getContentTheadData());
	if ((bg.getAnchorTheadData() != 'false' ) && (callState != 'CALL_END')) {
		var content = JSON.parse(bg.getAnchorTheadData());
 		var dataRows = content.dataRows.length;
 		var theadStr = ''; 
	
		for (var i = 0; i <= dataRows - 1; i++ ) {
			theadStr += content.dataRows[i].rowstart;
			theadStr += content.dataRows[i].cell_1;
			theadStr += content.dataRows[i].cell_2;
			theadStr += content.dataRows[i].cell_3;
			if (content.dataRows[i].cell_4) {
				theadStr += content.dataRows[i].cell_4;
			} 
			theadStr += content.dataRows[i].rowend;
			
		}
		thead.innerHTML = theadStr;
	}
} 
////////////////////////////////////////////////////////////////////////////////////////
function insertAnchorRows(table, callback) {
	console.log("cnt.uiInteractions insertAnchorRows json = " +  bg.getAnchorTableData() +"\n\n");
	if ((bg.getAnchorTableData() != 'false' ) && (callState != 'CALL_END')) {
		var content = JSON.parse(bg.getAnchorTableData());
 		var dataRows = content.dataRows.length;
		var tablestr = ''; 
		
		for (var i = 0; i <= dataRows - 1; i++ ) {
			tablestr += content.dataRows[i].rowstart;
			tablestr += content.dataRows[i].cell_1;
			tablestr += content.dataRows[i].cell_2;

			if (content.dataRows[i].cell_3) {
				tablestr += content.dataRows[i].cell_3;	
			} 
			tablestr += content.dataRows[i].rowend;
	
			
		}
		table.innerHTML = tablestr;
	}
	callback();
	adjustContentTable(incomingAnchorTable);
}

////////////////////////////////////////////////////////////////////////////////////////
function insertContentThead(thead) {
	incomingContentTitle.innerHTML = lc.getContentPrimary().replace('-', ' ');
console.log("cnt.uiInteractions insertContentThead json = " +  bg.getContentTheadData());
	if ((bg.getContentTheadData() != 'false' ) && (callState != 'CALL_END')) {
		var content = JSON.parse(bg.getContentTheadData());
 		var dataRows = content.dataRows.length;
 		var theadStr = ''; 
	
		for (var i = 0; i <= dataRows - 1; i++ ) {
			theadStr += content.dataRows[i].rowstart;
			theadStr += content.dataRows[i].cell_1;
			theadStr += content.dataRows[i].cell_2;
			theadStr += content.dataRows[i].cell_3;
			if (content.dataRows[i].cell_4) {
				theadStr += content.dataRows[i].cell_4;
			} 
			theadStr += content.dataRows[i].rowend;
			
		}
		thead.innerHTML = theadStr;
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function insertContentRows(table, callback) {
	incomingContentTitle.innerHTML = lc.getContentPrimary().replace('-', ' ');
	console.log("cnt.uiInteractions _callerTitleChange current value " + incomingMainTitle.innerHTML );
	//console.log("cnt.uiInteractions insertContentRows json = " +  bg.getContentTableData());
	if ((bg.getContentTableData() != 'false' ) && (callState != 'CALL_END')) {
		var content = JSON.parse(bg.getContentTableData());
 		var dataRows = content.dataRows.length;
 		var tablestr = ''; 
	
		for (var i = 0; i <= dataRows - 1; i++ ) {
			tablestr += content.dataRows[i].rowstart;
			tablestr += content.dataRows[i].cell_1;
			tablestr += content.dataRows[i].cell_2;
			tablestr += content.dataRows[i].cell_3;
			if (content.dataRows[i].cell_4) {
				tablestr += content.dataRows[i].cell_4;
			} // else remove the column header
			tablestr += content.dataRows[i].rowend;

		}
		table.innerHTML = tablestr;
		console.log("insertContentRows tablestr = " +  tablestr);
	}

	//document.getElementById('activities-thread').scrollTop; 
	callback();
	//adjustContentTable(incomingContentTable);
}

////////////////////////////////////////////////////////////////////////////////////////
function removeContentRows(table) {
console.log("cnt.uiInteractions Table Row Length == " + table.rows.length);
	/*for ( i = 0; i <= table.rows.length + 1;  i++) {
		var row = document.getElementById('remove'+ i);
		console.log("removing == " + table.rows.length);
		if(row) {
			row.parentElement.removeChild(row); 
		}
	}*/
}

////////////////////////////////////////////////////////////////////////////////////////
function _callStateChange(value) {
	 console.log("cnt.uiInteractions cnt.uiInteractions _callStateChange changed to = " + value);
	 if (value == 'RING' || value == 'DIAL' || value == 'CALL_START')  {
	 	callState = value;
	 	generalRingBox.style.visibility = "visible"; 
	 	setRingState();
	 	mainWindow.focus()
	 } else if (value == 'CONNECT') {
	 	callState = value;
	 	generalRingBox.style.visibility = "hidden"; 
	 	generalClockText.style.visibility = "hidden"; 
	 	//calculateTime(1000);
	 	incomingMainStatus.innerHTML	= "Connected To ...";
	 	console.log("cnt.uiInteractions _callStateChange CONNECT");
	 } else if (value == 'CALL_END') {
	 	callState = value;
	 	console.log("cnt.uiInteractions CALL_END callState == " + callState); 
	 	removeContentRows(incomingAnchorTable);
		removeContentRows(incomingContentTable);
		bg.setContentTableData(false);
		bg.setAnchorTableData(false);
		
	 	setInitialState();
	 	
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function setRingState() {

	//incomingMainStatus.innerHTML  	= "Incoming Call From ...";
	incomingMainPhone.innerHTML  	= bg.getCallIdforUI();
	incomingMainName.innerHTML		= bg.getCallerName();
	incomingMainTitle.innerHTML 	= '';
	
	console.log("cnt.uiInteractions setRingState should be set" + incomingMainPhone.innerHTML  +' <' + incomingMainTitle.incomingMainName +'>' );
	
	incomingMainStatus.style.visibility = "visible"; 
	incomingMainDiv.style.visibility 	= "visible";
	incomingMainPhone.style.visibility 	= "visible";
	incomingMainName.style.visibility 	= "visible";
	incomingMainTitle.setAttribute 		= "visible";
	
	generalRingBox.style.visibility 	= "visible";	
	generalClockText.style.visibility 	= "visible";
		
	//idleMainDiv.style.visibility 			= "hidden";
	//idleMainDiv.style.display 				= "none";
	idleTextDiv.style.visibility 		= "hidden";
	idleTextDiv.style.display 			= "none";
	idleTextDiv.style.zIndex 			= "-1";
	
	idleStatConnect.style.visibility 	= "hidden";
	idleStatError.style.visibility 		= "hidden";
	idleStatMsg.style.visibility 		= "hidden";
	
	callHistoryTopDiv.style.visibility 	= "hidden";
	callHistoryMainDiv.style.visibility = "hidden";
	callHistoryTable.style.visibility 	= "hidden";;
	callHistoryThead.style.visibility 	= "hidden";
	callHistoryTbody.style.visibility 	= "hidden";
	
	
	console.log("cnt.uiInteractions setRingState should be set" + incomingMainPhone.innerHTML +' <' + incomingMainTitle.incomingMainName +'>' );
	
}

////////////////////////////////////////////////////////////////////////////////////////
function resetRingState() {
	incomingMainDiv.style.visibility 		= "hidden";
	incomingMainDiv.style.display 			= "block";
	incomingMainPhone.style.visibility 		= "hidden";
	incomingMainTitle.style.visibility 		= "hidden";
	
	generalRingBox.style.visibility 		= "hidden";
	generalClockText.style.visibility 		= "hidden";
	stopTimer();
	
	idleMainDiv.style.visibility 			= "visible";
	idleMainDiv.style.display 				= "block";
	idleTextDiv.style.visibility			= "visible";
	idleTextDiv.style.display 				= "block";
	idleStatMsg.style.visibility			= "visible";
	if (idleStatMsg.innerHTML.indexOf('Waiting') > -1 ) {
		idleStatConnect.style.visibility			= "visible";
	} else {
		idleStatError.style.visibility				= "visible";
	}
	 
}
////////////////////////////////////////////////////////////////////////////////////////
function setContentState() {
	
	incomingMainStatus.style.visibility 	= "visible";
	incomingMainDiv.style.visibility 		= "visible";
	incomingMainDiv.style.display 			= "block";
	incomingMainPhone.style.visibility 		= "visible";
	incomingMainTitle.style.visibility 		= "visible";
	
	//idleMainDiv.style.visibility 			= "hidden";
	//idleMainDiv.style.display 				= "none";
	idleTextDiv.style.visibility			= "hidden";
	idleTextDiv.style.display 				= "none";
	idleTextDiv.style.zIndex 				= "0";
	idleStatMsg.style.visibility			= "hidden";
	idleStatConnect.style.visibility		= "hidden";
	idleStatError.style.visibility			= "hidden";
	
}
////////////////////////////////////////////////////////////////////////////////////////
function _anchorTableChange() {
	console.log("cnt.uiInteractions _anchorTableChange: " + bg.getAnchorTableData());
	if (bg.getAnchorTableData() === false) {
		//console.log("_anchorTableChange: " + bg.getAnchorTableData());
		removeContentRows(incomingAnchorTable);
	} else if ((bg.getAnchorTableData() != 'false' ) && (callState != 'CALL_END')) {
		console.log("cnt.uiInteractions _anchorTableChange: " + bg.getAnchorTableData());
		setContentState();
		
		
		incomingMainPhone.innerHTML 			= bg.getCallIdforUI();
		
		insertAnchorThead(incomingAnchorThead);
		insertAnchorRows(incomingAnchorTbody, wrangleColsforEvents);
		
		incomingAnchorDiv.style.visibility 		= "visible";
		incomingAnchorTable.style.visibility 	= "visible";
		incomingAnchorThead.style.visibility 	= "visible";
		incomingAnchorTbody.style.visibility 	= "visible";
		
		
		incomingMainDiv.style.visibility  		= "visible";
		incomingMainTitle.style.visibility 		= "visible";
		
		callHistoryTopDiv.style.visibility 		= "hidden";
		callHistoryMainDiv.style.visibility 	= "hidden";
		callHistoryTable.style.visibility 		= "hidden";
		callHistoryThead.style.visibility 		= "hidden";
		callHistoryTbody.style.visibility 		= "hidden";
		
	}
		
}

////////////////////////////////////////////////////////////////////////////////////////
function _contentTableChange() {
	//console.log("cnt.uiInteractions _contentTableChange");

	if (bg.getContentTableData() === false) {
		console.log("cnt.uiInteractions _contentTableChange: " + bg.getContentTableData());
		removeContentRows(incomingContentTable);
	} else if ((bg.getContentTableData() != 'false' ) && (callState != 'CALL_END')) {
		console.log("cnt.uiInteractions _contentTableChange: " + bg.getContentTableData());
	 	insertContentThead(incomingContentThead);
		insertContentRows(incomingContentTbody, wrangleColsforEvents);
		
		
		
		incomingContentDiv.style.visibility 		= "visible";
		incomingContentTable.style.visibility 		= "visible";
		incomingContentThead.style.visibility 		= "visible";
		incomingContentTbody.style.visibility 		= "visible";
		
		
		incomingMainDiv.style.visibility  		= "visible";
		incomingMainTitle.style.visibility 		= "visible";
		callHistoryTopDiv.style.visibility 		= "hidden";
		callHistoryMainDiv.style.visibility 	= "hidden";
		callHistoryTable.style.visibility 		= "hidden";
		callHistoryThead.style.visibility 		= "hidden";
		callHistoryTbody.style.visibility 		= "hidden";
	} 
	
}
////////////////////////////////////////////////////////////////////////////////////////
function _callerNameChange() {
	console.log("cnt.uiInteractions _callerNameChange");
	console.log("cnt.uiInteractions _callerNameChange current value " + incomingMainName.innerHTML );
	console.log("cnt.uiInteractions _callerNameChange new value " + bg.getCallerName() );
	incomingMainName.innerHTML =  incomingMainName.value = bg.getCallerName();
}
////////////////////////////////////////////////////////////////////////////////////////
function _callerTitleChange() {
	console.log("cnt.uiInteractions _callerTitleChange");
	console.log("cnt.uiInteractions _callerTitleChange current value " + incomingMainTitle.innerHTML );
	console.log("cnt.uiInteractions _callerTitleChange new value " + bg.getContactRole() );
	incomingMainTitle.innerHTML =  incomingMainTitle.value = bg.getContactRole();
	if  (( bg.getContactRole() === 'No Match Found') && (lc.getRoutePath() == 'usauto')) {
		
		newContactLink.onclick = function() {
   			window.open(lc.getCrmBaseUrl() + '/one/one.app#eyJjb21wb25lbnREZWYiOiJvbmU6YWxva' +
   				'GFQYWdlIiwiYXR0cmlidXRlcyI6eyJ2YWx1ZXMiOnsiYWRkcmVzcyI6Ii9zZXR1cC91aS9yZWNvcmR0eXBlc2VsZWN0Lmpzc'+
   				'D9lbnQ9MDFJNjEwMDAwMDEyam5YJnNhdmVfbmV3X3VybD0lMkZhMTAlMkZlJTNGX0NPTkZJUk1BVElPTlRPS0VOJTNEVm1wRlB'+
   				'TeE5ha0Y0VG5rd2QwNURNSGROYkZGNFRWUnZNRTVVYjNsTmVUUXhUMFJTWVN4S1prdExUelF3UjJKWFlrWTJabDl1ZUdGaFpISk' +
   				'RMRmxxUm14UFJGVXclMjZjb21tb24udWRkLmFjdGlvbnMuQWN0aW9uc1V0aWxPUklHX1VSSSUzRCUyNTJGYTEwJTI1MkZlJnZmUmV'+
   				'0VVJMSW5TRlg9aHR0cHMlM0ElMkYlMkZ1c2F1dG9zYWxlcy0tZnV6ZS5saWdodG5pbmcuZm9yY2UuY29tJTJGb25lJTJGb25lLmFwc'+
   				'CUyMyUyRnNPYmplY3QlMkZkZWFsZXJfX1NhbGVzX1VwX19jJTJGbGlzdCUzRmZpbHRlck5hbWUlM0RSZWNlbnQlMjZhJTNBdCUzRDE' +
   				'0OTA4NzQzMjMzODYiLCJoYXNIaXN0b3J5Ijp0cnVlfX0sImE6dCI6MTQ5MDg3NDYzODM1OX0%3D');
   			/*
   			newContactLink.setAttribute("href", bg.getCrmBaseUrl() + '/one/one.app#eyJjb21wb25lbnREZWYiOiJvbmU6YWxva' +
   				'GFQYWdlIiwiYXR0cmlidXRlcyI6eyJ2YWx1ZXMiOnsiYWRkcmVzcyI6Ii9zZXR1cC91aS9yZWNvcmR0eXBlc2VsZWN0Lmpzc'+
   				'D9lbnQ9MDFJNjEwMDAwMDEyam5YJnNhdmVfbmV3X3VybD0lMkZhMTAlMkZlJTNGX0NPTkZJUk1BVElPTlRPS0VOJTNEVm1wRlB'+
   				'TeE5ha0Y0VG5rd2QwNURNSGROYkZGNFRWUnZNRTVVYjNsTmVUUXhUMFJTWVN4S1prdExUelF3UjJKWFlrWTJabDl1ZUdGaFpISk' +
   				'RMRmxxUm14UFJGVXclMjZjb21tb24udWRkLmFjdGlvbnMuQWN0aW9uc1V0aWxPUklHX1VSSSUzRCUyNTJGYTEwJTI1MkZlJnZmUmV'+
   				'0VVJMSW5TRlg9aHR0cHMlM0ElMkYlMkZ1c2F1dG9zYWxlcy0tZnV6ZS5saWdodG5pbmcuZm9yY2UuY29tJTJGb25lJTJGb25lLmFwc'+
   				'CUyMyUyRnNPYmplY3QlMkZkZWFsZXJfX1NhbGVzX1VwX19jJTJGbGlzdCUzRmZpbHRlck5hbWUlM0RSZWNlbnQlMjZhJTNBdCUzRDE' +
   				'0OTA4NzQzMjMzODYiLCJoYXNIaXN0b3J5Ijp0cnVlfX0sImE6dCI6MTQ5MDg3NDYzODM1OX0%3D');
   			*/
   				
   			return false;
   		}
   		newContactLink.style.visibility 			= "visible";	
	}
}


function _promptCrmUser() {
	console.log("cnt.uiInteractions _contactTableChange: " + bg.getPrompt());
}

////////////////////////////////////////////////////////////////////////////////////////
function _callDirection() {
	console.log("cnt.uiInteractions _callDirection: " +  bg.getCallDirection());

	var callDir = bg.getCallDirection().toLowerCase();
	if (callDir.indexOf('inbound') > -1) {
		incomingMainStatus.innerHTML	= "INCOMING CALL FROM...";
	} else {
		incomingMainStatus.innerHTML	= "OUTGOING CALL TO...";
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function calculateTime(interval) {
	var seconds = 0;
	var minutes = 0;
	var hours = 0;
	setInterval(function() {
		seconds++;
		if (seconds >= 60) {
			seconds = 0;
        	minutes++;
    		if (minutes >= 60) {
            	minutes = 0;
            	hours++;
        	}
    	}
    	var timeData = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
		console.log("timeData : " + timeData);
		generalClockText.textContent =	timeData;
    },  1 * interval);
}

function stopTimer() {
	calculateTime(0)
}
////////////////////////////////////////////////////////////////////////////////////////////////////
function _displayStaus() {
console.info("cnt.uiInteractions _displayStatus: Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );



	if ( (bg.getSocketStatus() === true) && (bg.getCrmAuthStatus()  === true)) {
console.info("cnt.uiInteractions _displayStatusBoth = 1 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Waiting for a call...";

		connectionConnect.style.visibility = "hidden";
		connectionError.style.display = "none";
		connectionConnect.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "visible";
		connectionStatusErr.style.visibility = "hidden";

	} else if ( (bg.getSocketStatus() === false ) && (bg.getCrmAuthStatus() === true)) {
console.log("cnt.uiInteractions _displayStatusSocket 0 - CRM 1 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Waiting for Socket Start ...";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	} else if ( (bg.getSocketStatus() === true) && (bg.getCrmAuthStatus() === false )) {
console.log("cnt.uiInteractions _displayStatus Socket 1 CRM 0 Change in Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = lc.getConnectorName() + " Failed Authorization";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	} else {
console.log("cnt.uiInteractions _displayStatus Status Socket: " + bg.getSocketStatus() + " CRM: " + bg.getCrmAuthStatus() );

		connectionMessage.textContent = "Contact Fuze Support";
		
		connectionConnect.style.visibility = "hidden";
		connectionError.style.visibility = "visible";
		connectionMessage.style.visibility = "visible";
		connectionStatusOK.style.visibility = "hidden";
		connectionStatusErr.style.visibility = "visible";

	}
}


////////////////////////////////////////////////////////////////////////////////////////
// Event Handlers


ipcRenderer.on('contactrole', (event, arg) => {
	console.info("cnt.uiInteractions contactrole") // prints "pong"
	_callerTitleChange();
});

ipcRenderer.on('callername', (event, arg) => {
	console.info("cnt.uiInteractions callername") // prints "pong"
	_callerNameChange();
});
ipcRenderer.on('callstate', (event, arg) => {
	console.info("cnt.uiInteractions callstate " + arg) // prints "pong"
	_callStateChange(arg);
});
ipcRenderer.on('anchortable', (event, arg) => {
	console.info("cnt.uiInteractions anchortable") // prints "pong"
	_anchorTableChange();
});
ipcRenderer.on('contenttable', (event, arg) => {
	console.info("cnt.uiInteractions contenttable") // prints "pong"
	_contentTableChange();
});
ipcRenderer.on('callhistory', (event, arg) => {
	console.info("cnt.uiInteractions callhistory") // prints "pong"
	_callHistoryChange();
});
ipcRenderer.on('calldirection', (event, arg) => {
	console.info("cnt.uiInteractions calldirection") // prints "pong"
	_callDirection();
});

ipcRenderer.on('socketstatus', (event, arg) => {
	console.info("cnt.status contactrole") 
	_displayStaus();
});

ipcRenderer.on('crmauthstatus', (event, arg) => {
	console.info("cnt.uiInteractions socketstatus") 
	_displayStaus();
});


