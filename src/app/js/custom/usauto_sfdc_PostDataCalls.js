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
exports.usauto__sfdc__actionHandler = function(callState, json) {
		
	console.log("usauto__sfdc__actionHandler : " + callState); 
	console.log("usauto__sfdc__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'sales-up') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before usauto__sfdc__createSalesUp");
		usauto__sfdc__createSalesUp();
	} else if (json.type == 'logcall') {
		console.log("usauto__sfdc__actionHandler : end of call");
		
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
					console.log("sfdc__actionHandler: before sfdc__createCallLogBigPayload");
					usauto__sfdc__createCallLog(json.endtime, function() {
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
function usauto__sfdc__createSalesUp() {

	console.debug("IN usauto__sfdc__createSalesUp: ");
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/dealer__Sales_Up__c';

	var header = lc.getCloudElementsId();
	console.debug("usauto__sfdc__createSalesUp: " + url);
	console.debug("usauto__sfdc__createSalesUp: " + header);
	console.debug("usauto__sfdc__createSalesUp: bg.getAcctConnectorID() " + bg.getAcctConnectorID());
	console.debug("usauto__sfdc__createSalesUp: bg.getUserConnectorAcct() " + bg.getUserConnectorAcct());
	 
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.debug("usauto__sfdc__createSalesUp: " + datetime);

	var postData = '{ "dealer__FirstName__c":"' + bg.getCallerFirstName() + '", ';
		postData += '"dealer__LastName__c": "' + bg.getCallerLastName() + '", ';
		postData += '"dealer__Lead_Type__c": "Phone Up", ';
		postData += '"dealer__Lead_Status__c": "PHONE APPLICATION", ';
		postData += '"dealer__Source__c": "Unknown", ';
		postData += '"dealer__Email__c": "none@none.com", ';
		postData += '"dealer__Phone__c": "' + getFormattedCallID() + '", ';
		postData += '"OwnerId": "' + bg.getAcctConnectorID() + '"}';

	console.debug("usauto__sfdc__createSalesUp: " + postData + "\n\n\n\n\n");

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
    			console.log("usauto__sfdc__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(incidentUrl, 'New Opportunity' + results.Id);
    				console.log("usauto__sfdc__createSalesUp: New Opportunity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("usauto__sfdc__createSalesUp: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("usauto__sfdc__createSalesUp: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}
     
///////////////////////////////////////////////////////////////
function usauto__sfdc__createCallLog(endtime, successCallback) {

	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath() + '/task';
	
	var header = lc.getCloudElementsId();
	var recLink = lc.getRecordingLinkBase();
	var activityDay = bg.getFormattedDate('ymd');
		activityDay = activityDay.substring(0,activityDay.indexOf(' '));
	if (bg.getCallNotes() != 'false') {
    		postData +=  bg.getNoteValue() + ' ' + bg.getFormattedDate('mdy') +'\\r\\n\\r\\n", ';
   		}
	
	var callType = "Incoming Call";
	
	console.log("usauto__sfdc__createCallLog: recLink    " + recLink);
	console.log("usauto__sfdc__createCallLog: ActivityID " + bg.getActivityId());
	console.log("usauto__sfdc__createCallLog: Direction  " + bg.getCallDirection());
	console.log("usauto__sfdc__createCallLog: starttime  " + bg.getRawStartTime());
	console.log("usauto__sfdc__createCallLog: endtime    " + endtime);
	console.log("usauto__sfdc__createCallLog: wrap code  " + bg.getWrapUpCode());
   	console.log("usauto__sfdc__createCallLog: notes      " + bg.getCallNotes());
   	
   	if (bg.getCallDirection() == 'Outbound') {
   		callType = "Outgoing Call";
   	}
   	if (bg.getWrapUpCode() != 'false') {
   		console.log("usauto__sfdc__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (bg.getCallNotes() != 'false') {
		console.log("usauto__sfdc__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("usauto__sfdc__createCallLog: duration   " + duration);
	console.log("usauto__sfdc__createCallLog: starttime   " + bg.getStarttime());
	console.log("usauto__sfdc__createCallLog: endtime   " + bg.getFormattedDate('mdy'));
	console.log("usauto__sfdc__createCallLog: Date   " + activityDay);

	var postData = '{ "Subject" : "Call Log" , ';
		postData += '"WhatId": "' + bg.getActivityId() +'", ';
		postData += '"TaskSubtype": "Task", '
		postData += '"Type": "Call", '
		postData += '"Priority": "Normal", '
		postData += '"CallType__c" : "' + callType + '", '; 
		postData += '"Status": "Completed" ,';
		postData += '"Type" : "Phone Call", ';
		postData += '"ActivityDate": "' + activityDay + '", ';
		//postData += '"Description" : "' + callType +  '  Start Time = ' + bg.getStarttime() + ' ';
		postData += '"Description" : "'; 
		if (bg.getCallNotes() != 'false') {
			var n = bg.getNoteValue().substring(0,255);
    		postData +=  bg.getNoteValue() + '", ';
   		}
		
		postData += '"dealer__Quick_Note__c": "';
		if (bg.getCallNotes() != 'false') {
    		var n = bg.getNoteValue().substring(0,255);
    		postData +=  bg.getNoteValue();
   		}
    
    
		//postData += 'Start Time = ' + bg.getStarttime() + '\\r\\n';
		//postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
		//if (bg.getWrapUpCode() != 'false') {
		//	postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
    	//}
    	//
    	//if (lc.getRecordingLinkBase()) {
    	//	postData += 'Call Record Link:  '+ recLink + '?userID=' + bg.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
    	//}
   
    postData +=  '"}';

	console.log("usauto__sfdc__createCallLog" + postUrl);
	console.log("usauto__sfdc__createCallLog" + postData);
	
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
    			console.log("usauto__sfdc__createCallLog: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("usauto__sfdc__createCallLog: ID == " + results.Id + "Description " + results.Description );

    			} else {
    				console.log("usauto__sfdc__createCallLog: Failed to Create a new Log " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}
