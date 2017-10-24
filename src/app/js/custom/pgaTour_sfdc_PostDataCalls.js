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
exports.pgaTour__actionHandler = function(callState, json) {
		
	console.log("pgaTour__actionHandler : " + callState);
	console.log("pgaTour__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'reservation') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);

		var openwinurl = lc.getCrmBaseUrl() + '/one/one.app#/sObject/Reservation__c/new?count=1';
		console.log("openwindow == " + openwinurl );

		var new_window = window.open(openwinurl, "New reservation");
		new_window.focus();

	} else if (json.type == 'logcall') {
		console.log("pgaTour__actionHandler : end of call");

       if (bg.getHistoryFlag() == 'true') {
			console.log("bg.getHistoryFlag() == true");
			bg.createCallHistory();
			bg.setHistoryFlag('false');
		}
        bg.setCallState('CALL_END');
        
        bg.closePgaScriptWindow('browser');
		
		if ((bg.getActivityId() != 'false') &&  (bg.getActivityId() !== null)) {
        	if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
                console.log("sfdc__actionHandler: Wrap Up Codes or Call Notes Required");
				var json ={pageUrl: pjson.config.callnotes, callerName: bg.getCallerName()}
				ipcRenderer.send('open-utility-window', json);
            } else {
               console.log("sfdc__actionHandler: do the sfdc__createCallLog(json.endtime)");
				if ( lc.getCrmType() == "Standard" ){
					console.log("sfdc__actionHandler: before sfdc__createCallLogBigPayload");
					//sfdc__createCallLog(json.endtime, sfdc__resetData);
					pgaTour__createCallLogBigPayload(json.endtime, function() {
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

function pgaTour_getCousesData() {
console.log("pgaTour_getCousesData")
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/Course__c';

	console.log("pgaTour_getCousesData: url == " + url);


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var results = JSON.parse( xhr.responseText );
				console.log("pgaTour_getCousesData len=" + results.length)
				console.log("pgaTour_getCousesData data:" + results)

				bg.showPGAReservationWindow(results);
				bg.setCrmAuthStatus(true);
			} else {
				bg.setCrmAuthStatus(false);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}

	}
	xhr.send(null);
}


///////////////////////////////////////////////////////////////
function pgaTour__createReservation(category, course) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/Reservation__c';
	var header = lc.getCloudElementsId();
	console.log("pgaTour__createReservation: " + url);
	console.log("pgaTour__createReservation: " + header);

	var courseId = "";
	chrome.storage.local.get(['courses'], function (result) {
		console.log("Courses len: " + result.courses.lenght)
		for(var i = 0; i < result.courses.lenght; i++)
		{
			if(result.courses[i].Name == course)
			{
				courseId = result.courses[i].Id;
			}
		}
	});
	var postData = '{ "Course_Category__c":"' + category + '", ';
		postData += '"Course__c": "' + courseId + '", ';
		postData += '"Account__c": "' + bg.getAcctConnectorID() + '", ';
		postData += '"Member__c": "' + bg.getUserConnectorAcct() + '"}';

	console.log("pgaTour__createReservation: " + postData + "\n\n\n\n\n");

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
    			console.log("pgaTour__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;

					var new_window = window.open(incidentUrl, 'New Reservation');
    				console.log("pgaTour__createReservation: New Reservation " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("pgaTour__createReservation: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else {
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status);
    			alert("pgaTour__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}
  	};
	xhr.send(postData);

}
     
///////////////////////////////////////////////////////////////
function pgaTour__createCallLog(endtime, postData, successCallback, failCallback) {

	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/Reservation__c/' + bg.getActivityId() + '/tasks';
	var header = lc.getCloudElementsId();

	
	console.log("pgaTour__createCallLog" + postUrl);
	console.log("pgaTour__createCallLog" + postData);
	
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
    			console.log("pgaTour__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("pgaTour__createIncident: ID == " + results.Id + "Description " + results.Description );
					//var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					//var new_window = window.open(incidentUrl, 'New Opportunity');
    			} else {
    				console.log("pgaTour__createIncident: Failed to Create a new Incident " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			//alert("pgaTour__createCallLog: Invalid CRM User" + xhr.responseText);
    			failCallback(endtime, successCallback);
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}

///////////////////////////////////////////////////////////////
function pgaTour__createCallLogBigPayload(endtime, successCallback) {
	
	var recLink = lc.getRecordingLinkBase();
	
	console.log("pgaTour__createCallLog: recLink   " + recLink);
	console.log("pgaTour__createCallLog: ID        " + bg.getActivityId());
	console.log("pgaTour__createCallLog: Direction " + bg.getCallDirection());
	console.log("pgaTour__createCallLog: starttime " + bg.getRawStartTime());
	console.log("pgaTour__createCallLog: endtime   " + endtime);
	console.log("pgaTour__createCallLog: wrap code   " + bg.getWrapUpCode());
   	console.log("pgaTour__createCallLog: notes   " + bg.getCallNotes());
   	if (bg.getWrapUpCode() != 'false') {
   		console.log("pgaTour__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (bg.getCallNotes() != 'false') {
		console.log("pgaTour__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("pgaTour__createCallLog: duration   " + duration);
	console.log("pgaTour__createCallLog: starttime   " + bg.getStarttime());
	console.log("pgaTour__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"CallType" : "' + bg.getCallDirection() + '", ';
		postData += '"CallDurationInSeconds" : "'+ duration +'", ';
		postData += '"Status": "Completed" ,';
		postData += '"WhatId": "' + bg.getActivityId() + '" ,';

		//postData += '"Type" : "Phone Call", ';
		postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
	if (bg.getWrapUpCode() != 'false') {
    	postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
    }
	if (bg.getCallNotes() != 'false') {
    	postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
    }
    // if (lc.getRecordingLinkBase()) {
    // 	postData += 'Call Record Link:  '+ recLink + '?userID=' + bg.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
    // }
    postData +=  '\\r\\n"}';
      
    pgaTour__createCallLog(endtime, postData, successCallback, pgaTour__createCallLogSmallgPayload);
}
///////////////////////////////////////////////////////////////
function pgaTour__createCallLogSmallgPayload(endtime, successCallback) {

	var recLink = lc.getRecordingLinkBase();
	console.log("pgaTour__createCallLog: recLink   " + recLink);
	console.log("pgaTour__createCallLog: ID        " + bg.getActivityId());
	console.log("pgaTour__createCallLog: Direction " + bg.getCallDirection());
	console.log("pgaTour__createCallLog: starttime " + bg.getRawStartTime());
	console.log("pgaTour__createCallLog: endtime   " + endtime);
	console.log("pgaTour__createCallLog: wrap code " + bg.getWrapUpCode());
   	console.log("pgaTour__createCallLog: notes     " + bg.getCallNotes());
   	if (bg.getWrapUpCode() != 'false') {
   		console.log("pgaTour__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (bg.getCallNotes() != 'false') {
		console.log("pgaTour__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("pgaTour__createCallLog: duration   " + duration);
	console.log("pgaTour__createCallLog: starttime   " + bg.getStarttime());
	console.log("pgaTour__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

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
      
    pgaTour__createCallLog(endtime, postData, successCallback, successCallback);
}
///////////////////////////////////////////////////////////////
