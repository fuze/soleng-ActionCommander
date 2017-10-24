'use strict'
const { remote, shell, ipcRenderer } = require('electron');

const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');

const cloudElementsUrl = pjson.config.cloudElementsUrl;

///////////////////////////////////////////////////////////////
exports.netsuite__actionHandler = function (callState, json) {

	console.log("netsuite__actionHandler : " + callState);
	console.log("netsuite__actionHandler : " + JSON.stringify(json));

	if (json.type == 'activities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		netsuite__createActivity();
	} else if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before netsuite__createOpportunity : end of call");

		netsuite__createOpportunity();

	} else if (json.type == 'logcall') {
		console.log("netsuite__actionHandler : end of call");


		if (bg.getHistoryFlag()) {
			console.log("netsuite__actionHandler bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag(false);
		}
		bg.setCallState('CALL_END');

		if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
			console.log("netsuite__actionHandler: Wrap Up Codes or Call Notes Required");
			var json ={pageUrl: pjson.config.callnotes, callerName: bg.getCallerName()}
			ipcRenderer.send('open-utility-window', json);
		}
	} else if (json.type == 'saveNotes') {
		console.log("netsuite___actionHandler : savenotes ");

		netsuite__createCallLog(json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
			thisWindow.close()
		});
	}
}
            
///////////////////////////////////////////////////////////////
function netsuite__createActivity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/activities';
	var header = lc.getCloudElementsId();
	console.log("netsuite__createActivity: " + url);
	console.log("netsuite__createActivity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2) + 'T00:00:00.000+0000'; 
	
	console.log("netsuite__createActivity: " + datetime);

	var postData = '{ "title":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"startDate":"' + datetime + '", ';
		postData += '"company": {"internalId": "' + bg.getAcctConnectorID() + '"}, ';
		postData += '"contact": {"internalId": "' + bg.getUserConnectorAcct() + '"}} ';

	console.log("netsuite__createActivity: " + postData + "\n\n\n\n\n");
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("Content-Type", "application/json");   
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.log("netsuite__createActivity: resp.success == " + xhr.responseText);
				if (results.internalId) {
					bg.setActivityId(results.internalId);
					var activityUrl = lc.getCrmBaseUrl() + '/app/crm/calendar/task.nl?id=' + results.internalId;

					shell.openExternal(activityUrl)

    				console.log("netsuite__createActivity: New Activity " + results.internalId);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("netsuite__createActivity: Failed to Create a new Activity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("netsuite__createActivity: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}

///////////////////////////////////////////////////////////////
function netsuite__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("netsuite__createOpportunity: " + url);
	console.log("netsuite__createOpportunity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.warn("netsuite__createActivity: " + datetime);

	var postData = '{ "title":"' + bg.getStarttime() + ' - Temporary Description", ';
	postData += '"expectedCloseDate": "' + datetime + '", ';
	postData += '"entity": {"internalId": "' + bg.getAcctConnectorID() + '"}, ';
	postData += '"status": "In Progress"}';



	console.log("netsuite__createOpportunity: " + postData + "\n\n\n\n\n");

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("Content-Type", "application/json");   
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.log("netsuite__Validate: resp.success == " + xhr.responseText);
				if (results.internalId) {
					bg.setActivityId(results.internalId);
					var incidentUrl = lc.getCrmBaseUrl() + '/app/accounting/transactions/opprtnty.nl?id=' + results.internalId;

					shell.openExternal(incidentUrl)
					console.log("netsuite__createOpportunity: New Opportunity " + results.internalId);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("netsuite__createOpportunity: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("netsuite__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}
     
///////////////////////////////////////////////////////////////
function netsuite__createCallLog(endtime, successCallback) {

	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	var header = lc.getCloudElementsId();
	var recLink = lc.getRecordingLinkBase();

	postUrl += '/activities';


	var postData = '{ "title":"' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
	postData += '"company": {"internalId": "' + bg.getAcctConnectorID() + '"}, ';
	postData += '"contact": {"internalId": "' + bg.getUserConnectorAcct() + '"}, ';
	postData += '"message" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
	postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';

	if (((bg.getActivityId() == 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct() == 'false') ||  (bg.getUserConnectorAcct() == null))) {
		postData += '\\r\\n';
		postData += 'Caller Name : ' + bg.getCallerName() + '\\r\\n';
		postData += 'Caller Number : ' + bg.getCallIdforUI() + '\\r\\n';
	}

	if (lc.getWrapUpCode() != 'false') {
		postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
	}
	if (lc.getCallNotes() != 'false') {
		postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
	}
	if (lc.getRecordingLinkBase()) {
		postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
	}
	postData +=  '\\r\\n"}';


	console.log("netsuite__createCallLog" + postUrl);
	console.log("netsuite__createCallLog" + postData);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('POST', postUrl, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("Content-Type", "application/json");   
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.log("netsuite__createCallLog: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("netsuite__createCallLog: ID == " + results.Id + " Description " + results.Description );
					//var incidentUrl = bg.getCrmBaseUrl() + '/' + results.Id;
					//var new_window = window.open(incidentUrl, 'New Opportunity');
    			} else {
    				console.log("netsuite__createCallLog: Failed to Create a new Incident " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			//alert("netsuite__createCallLog: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}

///////////////////////////////////////////////////////////////