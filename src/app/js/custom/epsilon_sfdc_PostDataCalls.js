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
exports.epslion__sfdc__actionHandler = function(callState, json) {
		
	console.log("epsilon__sfdc__actionHandler : " + callState); 
	console.log("epsilon__sfdc__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'activities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		epsilon__sfdc__createActivity();
	} else if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before epsilon__sfdc__createOpportunity : end of call");
		epsilon__sfdc__createOpportunity();
	} else if (json.type == 'tasks') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before epsilon__sfdc__createOpportunity : end of call");
		epsilon__sfdc__createTask();
	} else if (json.type == 'logcall') {
		console.log("epsilon__sfdc__actionHandler : end of call");

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
            	console.log("epsilon__sfdc__actionHandler: Wrap Up Codes or Call Notes Required");
				epsilon__sfdc__createCallLogPayload(json.endtime, function() {
					reset.resetBackGroundData()
					var thisWindow = remote.getCurrentWindow();
    				thisWindow.close()
    			});
            }
		} else {
			reset.resetBackGroundData();
		}
	}
}
            
///////////////////////////////////////////////////////////////
function epsilon__sfdc__createActivity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/accounts/' + bg.getAcctConnectorID() + '/activities';
	var header = lc.getCloudElementsId();
	console.log("epsilon__sfdc__createActivity: " + url);
	console.log("epsilon__sfdc__createActivity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2) + 'T00:00:00.000+0000'; 
	
	console.log("epsilon__sfdc__createActivity: " + datetime);

	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"DurationInMinutes": "60", ';
		postData += '"ActivityDateTime":"' + datetime + '", ';
		postData += '"WhoId": "' + bg.getUserConnectorAcct() + '"}';

	console.log("epsilon__sfdc__createActivity: " + postData + "\n\n\n\n\n");
	
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
    			console.log("epsilon__sfdc__createActivity: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var activityUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(activityUrl, 'New Activity' + results.Id);
    				console.log("epsilon__sfdc__createActivity: New Activity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("epsilon__sfdc__createActivity: Failed to Create a new Activity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("epsilon__sfdc__createActivity: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function epsilon__sfdc__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("epsilon__sfdc__createOpportunity: " + url);
	console.log("epsilon__sfdc__createOpportunity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.log("epsilon__sfdc__createActivity: " + datetime);

	var postData = '{ "Name":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"AccountId": "' + bg.getAcctConnectorID() + '", ';
		postData += '"StageName": "Discovery", ';
		postData += '"CloseDate": "' + datetime + '"}';

	console.log("epsilon__sfdc__createOpportunity: " + postData + "\n\n\n\n\n");

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
    			console.log("epsilon__sfdc__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(incidentUrl, 'New Opportunity' + results.Id);
    				console.log("epsilon__sfdc__createOpportunity: New Opportunity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("epsilon__sfdc__createOpportunity: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("epsilon__sfdc__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}

///////////////////////////////////////////////////////////////
function epsilon__sfdc__createTask() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/tasks';
	var header = lc.getCloudElementsId();
	console.log("epsilon__sfdc__createTask: " + url);
	console.log("epsilon__sfdc__createTask: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.log("epsilon__sfdc__createTask: " + datetime);

	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		//postData += '"AccountId": "' + bg.getAcctConnectorID() + '", ';
		postData += '"WhoId": "' + bg.getUserConnectorAcct() + '", ';
		postData += '"Status": "Not Started", ';
		postData += '"TaskSubtype": "Task" }';
		
	console.error("epsilon__sfdc__createTask: " + postData + "\n\n\n\n\n");

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
    			console.log("epsilon__sfdc__createTask: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(incidentUrl, 'New Opportunity' + results.Id);
    				console.log("epsilon__sfdc__createTask: New Opportunity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("epsilon__sfdc__createTask: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("epsilon__sfdc__createTask: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}
     
///////////////////////////////////////////////////////////////
function epsilon__sfdc__createCallLog(endtime, postData, successCallback) {

	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/tasks';
	var header = lc.getCloudElementsId();

	
	console.log("epsilon__sfdc__createCallLog" + postUrl);
	console.log("epsilon__sfdc__createCallLog" + postData);
	
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
    			console.log("epsilon__sfdc__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("epsilon__sfdc__createIncident: ID == " + results.Id + "Description " + results.Description );

    			} else {
    				console.log("epsilon__sfdc__createIncident: Failed to Create a new Incident " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			successCallBack();
      		}
      	}  
  	}; 
	xhr.send(postData);
}

///////////////////////////////////////////////////////////////
function epsilon__sfdc__createCallLogPayload(endtime, successCallback) {

	var recLink = lc.getRecordingLinkBase();
	console.log("epsilon__sfdc__createCallLogPayload: recLink   " + recLink);
	console.log("epsilon__sfdc__createCallLogPayload: ID        " + bg.getActivityId());
	console.log("epsilon__sfdc__createCallLogPayload: Direction " + bg.getCallDirection());
	console.log("epsilon__sfdc__createCallLogPayload: starttime " + bg.getRawStartTime());
	console.log("epsilon__sfdc__createCallLogPayload: endtime   " + endtime);
	console.log("epsilon__sfdc__createCallLogPayload: wrap code " + bg.getWrapUpCode());
   	console.log("epsilon__sfdc__createCallLogPayload: notes     " + bg.getCallNotes());
   	if (bg.getWrapUpCode() != 'false') {
   		console.log("epsilon__sfdc__createCallLogPayload: Wrap Code " + bg.getWrapUpValue());
   	}
	if (bg.getCallNotes() != 'false') {
		console.log("epsilon__sfdc__createCallLogPayload: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("epsilon__sfdc__createCallLogPayload: duration   " + duration);
	console.log("epsilon__sfdc__createCallLogPayload: starttime   " + bg.getStarttime());
	console.log("epsilon__sfdc__createCallLogPayload: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"CallType" : "' + bg.getCallDirection() + '", ';
		postData += '"CallDurationInSeconds" : "'+ duration +'", ';
		postData += '"Status": "Completed" ,';
		postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
	if (bg.getWrapUpCode() != 'false') {
    	postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
    }
	if (bg.getCallNotes() != 'false') {
    	postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
    }
    if (lc.getRecordingLinkBase()) {
    	postData += 'Call Record Link:  '+ recLink + '?userID=' + bg.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
    }
    postData +=  '\\r\\n"}';
      
    epsilon__sfdc__createCallLog(endtime, postData, successCallback);
} 
