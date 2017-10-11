'use strict'

const { remote, ipcRenderer } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const util = require('../util/setCallData')
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');


const recordingAttempts  = pjson.config.recordingAttempts;
const recordingDelayTime = pjson.config.recordingDelayTime;
const callRecordingURL = pjson.config.callRecordingURL;

const cloudElementsUrl = pjson.config.cloudElementsUrl;
///////////////////////////////////////////////////////////////
exports.justGiving__actionHandler = function(callState, json) {
	
	console.log("justGiving__actionHandler : " + callState);
	console.log("justGiving__actionHandler : " + JSON.stringify(json));

	if (json.type == 'incident') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		justGiving__createIncident();
	} else if (json.type == 'logcall') {
		console.log("justGiving__actionHandler : end of call");

		console.log("justGiving__actionHandler bg.getHistoryFlag(): " + bg.getHistoryFlag());
		if (bg.getHistoryFlag() == 'true') {
			console.log("bg.getHistoryFlag() == true");
			bg.createCallHistory();
			bg.setHistoryFlag('false');
		}
		bg.setCallState('CALL_END');
		
		if ((bg.getActivityId() != 'false') &&  (bg.getActivityId() !== null)) {
        	if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
                console.log("sfdc__actionHandler: Wrap Up Codes or Call Notes Required");
                ipcRenderer.send('open-utility-window', pjson.config.callnotes);
            } else {
               console.log("sfdc__actionHandler: do the sfdc__createCallLog(json.endtime)");
				if ( lc.getCrmType() == "Standard" ){
					console.log("justGiving__actionHandler: do the justGiving__createCallLog(json.endtime)");
					justGiving__createCallLog(json.endtime, bg.resetBackGroundData);
					justGiving__createCallLog(json.endtime, function() {
						reset.resetBackGroundData()
						var thisWindow = remote.getCurrentWindow();
    					thisWindow.close()
    				});
				} 
            }
		} else {
			reset.resetBackGroundData();
		}
	}
}
///////////////////////////////////////////////////////////////
function justGiving__createIncident() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/incidents';
	var header = lc.getCloudElementsId();
	console.log("justGiving__createIncident: " + url);
	console.log("justGiving__createIncident: " + header);
	
	var postData = '{ "description": "Fuze Connect Created Ticket ' + bg.getStarttime() + '", ';
	 	postData += '"status":"new", ';
		postData += '"organization_id": "' + bg.getAcctConnectorID() + '", ';
		postData += '"requester_id": "' + bg.getUserConnectorAcct() + '"}';

	console.log("justGiving__createIncident: " + postData + "\n\n\n\n\n");
	
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
    			console.log("justGiving__createIncident: resp.success == " + xhr.responseText);
    			console.log("justGiving__createIncident: xhr.status = " + xhr.status);
				if (results.id) {
					bg.setActivityId(results.id);
					incidentsOpenWindow('Incident', results.id);
    				console.log("justGiving__createIncident: New Incident " + results.id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("justGiving__createIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("justGiving__createIncident: xhr.responseText = " + xhr.responseText);
    			console.log("justGiving__createIncident: xhr.status = " + xhr.status);
    			alert("justGiving__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}

///////////////////////////////////////////////////////////////
function justGiving__createNewIncident(callerId) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/incidents';
	var header = lc.getCloudElementsId();
	console.log("justGiving__createNewIncident: " + url);
	console.log("justGiving__createNewIncident: " + header);

	//12-20-2016 11:34:42
	var date = moment().format('MM-DD-YYYY  HH:mm:ss'); // May 9th 2017, 4:55:22 pm
	var postData = '{ "description": "' + callerId + ' - ' + date + '", ';
	postData += '"status":"new"}';

	console.log("justGiving__createNewIncident: " + postData + "\n\n\n\n\n");

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
				console.log("justGiving__createNewIncident: resp.success == " + xhr.responseText);
				console.log("justGiving__createNewIncident: xhr.status = " + xhr.status);
				if (results.id) {
					bg.setActivityId(results.id);
					incidentsOpenWindow('Incident', results.id);
					console.log("justGiving__createNewIncident: New Incident " + results.id);
					bg.setCrmAuthStatus(true);
				} else {
					console.log("justGiving__createNewIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
				}
			} else {
				bg.setCrmAuthStatus(false);
				console.log("justGiving__createNewIncident: xhr.responseText = " + xhr.responseText);
				console.log("justGiving__createNewIncident: xhr.status = " + xhr.status);
				alert("justGiving__Validate: Invalid CRM User" + xhr.responseText);
			}
		}
	};
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function justGiving__updateIncident() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/incidents/' + bg.getActivityId();
	var header = lc.getCloudElementsId();
	console.log("justGiving__updateIncident: " + url);
	console.log("justGiving__updateIncident: " + header);

	//12-20-2016 11:34:42
	var date = moment().format('MM-DD-YYYY  HH:mm:ss'); // May 9th 2017, 4:55:22 pm
	var postData = '{ "description": "' + bg.getCallerName() + ' - ' + bg.getStarttime() + '"}';

	console.log("justGiving__updateIncident: " + postData + "\n\n\n\n\n");

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('PATCH', url, true);
	xhr.setRequestHeader("Authorization",  header );
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var results = JSON.parse( xhr.responseText );
				console.log("justGiving__updateIncident: resp.success == " + xhr.responseText);
				console.log("justGiving__updateIncident: xhr.status = " + xhr.status);

			} else {
				bg.setCrmAuthStatus(false);
				console.log("justGiving__updateIncident: xhr.responseText = " + xhr.responseText);
				console.log("justGiving__updateIncident: xhr.status = " + xhr.status);
				alert("justGiving__Validate: Invalid CRM User" + xhr.responseText);
			}
		}
	};
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function justGiving__createCallLog(endtime, callback) {

	var recLink = lc.getRecordingLinkBase();
	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/' + bg.getContentPrimary() +'/' + bg.getActivityId() + '/comments';
	var header = lc.getCloudElementsId();
	
	console.log("justGiving__createCallLog: recLink   " + recLink);
	console.log("justGiving__createCallLog: url       " + postUrl);
	console.log("justGiving__createCallLog: header    " + header);
	console.log("justGiving__createCallLog: ID        " + bg.getActivityId());
	console.log("justGiving__createCallLog: Direction " + bg.getCallDirection());
	console.log("justGiving__createCallLog: starttime " + bg.getRawStartTime());
	console.log("justGiving__createCallLog: endtime   " + endtime);
	console.log("justGiving__createCallLog: wrap code   " + bg.getWrapUpCode());
	console.log("justGiving__createCallLog: notes   " + bg.getCallNotes());
	if (bg.getWrapUpCode() != 'false') {
		console.log("justGiving__createCallLog: Wrap Code " + bg.getWrapUpValue());
	}
	if (bg.getCallNotes() != 'false') {
		console.log("justGiving__createCallLog: CallNotes " + bg.getNoteValue());
	}
	
	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("justGiving__createCallLog: duration   " + duration);
	console.log("justGiving__createCallLog: starttime   " + bg.getStarttime());
	console.log("justGiving__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "type" : "comment", "public" : "false", ';
		postData += '"body" : "' + bg.getCallerName() +' - ' + bg.getStarttime() + '\\r\\n';
		postData += 'Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy')+ '\\r\\n\\r\\n';
		if (bg.getWrapUpCode() != 'false') {
			postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
		}
		if (bg.getCallNotes() != 'false') {
			postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
			//postData = postData.replace(/(\r\n|\n|\r)/gm,"\\r\\n");
		}
		if (lc.getRecordingLinkBase()) {
			postData += 'Call Record Link:  '+ recLink + '?userID=' + bg.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
		} 
		postData +=  '\\r\\n"}';

	console.log("justGiving__createCallLog" + postData);
	
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
    			console.log("justGiving__Validate: resp.success == " + xhr.responseText);
				if (results.id) {
					bg.setActivityId(''); 
					var callLogId = results.id;
					var description = results.Description;
    			
    				console.log("justGiving__createIncident: ID == " + results.id + "Description " + results.Description );
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("justGiving__createIncident: Failed to Create a new Incident " + postData );
    			}
    			callback();
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("justGiving__createCallLog: Invalid CRM User" + xhr.responseText);
    			callback();
      		}
      	}  
  	}; 
	xhr.send(postData);
}
