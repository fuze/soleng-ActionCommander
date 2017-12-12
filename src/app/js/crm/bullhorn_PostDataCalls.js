'use strict'

const { remote, shell } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const util = require('../util/setCallData')
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');


const recordingAttempts  = pjson.config.recordingAttempts;
const recordingDelayTime = pjson.config.recordingDelayTime;
const cloudElementsUrl = pjson.config.cloudElementsUrl;


///////////////////////////////////////////////////////////////
exports.bullhorn__actionHandler = function(callState, json) {
		
	console.log("bullhorn__actionHandler : " + callState); 
	console.log("bullhorn__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid)
		bullhorn__createOpportunity();
	} else if (json.type == 'job-orders') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid)

		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=JobOrder&view=Add'
			+ '&personReferenceID=' + json.uid;
		//+ '?t=' +  (new Date().getTime());
		console.log("open new job: " + openwinurl)
		shell.openExternal(openwinurl)

	} else if (json.type == 'logcall') {
		console.log("bullhorn__actionHandler : end of call");

       if (bg.getHistoryFlag() == 'true') {
			console.log("bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag('false');
		}
        bg.setCallState('CALL_END');

		//open notes window if some thing has bee selected?!?!?
		// I think we need to rework this so that the PersonlRef is populated 
		// with the one that is associated with contact, canidate, lead that is clicked.
		// else it stays false.
		if (bg.getContactLeadId() != false) {

			console.log("IsCallAnswered: " + bg.getIsCallAnswered() + " Direction: " + bg.getCallDirection() )
			if( (bg.getIsCallAnswered() == 'false') && (bg.getCallDirection().toLowerCase() == 'inbound') ){
				console.log("Inboung Call not answered -> Not call log")
			} else {
				var personalRef = '{' + bg.getContactLeadId() + '}';
				var obj = JSON.parse(personalRef);
				console.log("PersonalRef " + personalRef)

				var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Note&view=Add'
					+ '&action=Phone Call'
					+ '&personReferenceID=' + obj.personReference.id;
				shell.openExternal(openwinurl)
				//var new_window = window.open(openwinurl, "Create Call Log" + obj.personReference.id );
				reset.resetBackGroundData();
			}
		}
	}
}

function bullhorn__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("bullhorn__createOpportunity: " + url);
	console.log("bullhorn__createOpportunity: " + header);

	var currentdate = new Date();
	var datetime = currentdate.getFullYear() + '-'
		+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-'
		+ ('0' + currentdate.getDate()).slice(-2);

	console.log("bullhorn__createOpportunity: " + datetime);

	var postData = '{ "title":"' + bg.getStarttime() + ' - Temporary Description", ';
	postData += '"clientContact": {"id": ' + bg.getUserConnectorAcct() + '}, ';
	postData += '"clientCorporation": {"id": ' + bg.getAcctConnectorID() + '}, ';
	postData += '"status": "Open", ';
	postData += '"type": "Contract"}';

	console.log("bullhorn__createOpportunity: " + postData + "\n\n\n\n\n");

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
				console.log("bullhorn__Validate: resp.success == " + xhr.responseText);
				if (results.id) {
					//bg.setActivityId(results.Id);

					var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Opportunity&id=' + results.id + '&view=Overview';
					shell.openExternal(openwinurl)

					console.log("bullhorn__createOpportunity: New Opportunity " + results.id);
					bg.setCrmAuthStatus(true);
				} else {
					console.log("bullhorn__createOpportunity: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
				}
			} else {
				//bg.setCrmAuthStatus(true);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
				alert("bullhorn__Validate: Invalid CRM User" + xhr.responseText);
			}
		}
	};
	xhr.send(postData);

}

///////////////////////////////////////////////////////////////
/*function bullhorn__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/accounts/' + bg.getAcctConnectorID() + '/activities';
	var header = lc.getCloudElementsId();
	console.log("bullhorn__createActivity: " + url);
	console.log("bullhorn__createActivity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2) + 'T00:00:00.000+0000'; 
	
	console.log("bullhorn__createActivity: " + datetime);

	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"DurationInMinutes": "60", ';
		postData += '"ActivityDateTime":"' + datetime + '", ';
		postData += '"WhoId": "' + bg.getUserConnectorAcct() + '"}';

	console.log("bullhorn__createActivity: " + postData + "\n\n\n\n\n");
	
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
    			console.log("bullhorn__createActivity: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var activityUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(activityUrl, 'New Activity');
    				console.log("bullhorn__createActivity: New Activity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("bullhorn__createActivity: Failed to Create a new Activity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("bullhorn__createActivity: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}*/

     
///////////////////////////////////////////////////////////////
function bullhorn__createCallLog(endtime, successCallback) {

	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/notes';
	var header = lc.getCloudElementsId();

	console.log("bullhorn__createCallLog" + postUrl);
	console.log("bullhorn__createCallLog" + postData);

	var recLink = lc.getRecordingLinkBase();
	var duration = Math.round(((endtime - bg.getRawStartTime()) / 1000)/60);

	var personalRef = bg.getContactLeadId();

	console.log("Persoanl Ref: " + personalRef)
//	var postData = '{ "comments" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
	var	postData = '{ "action" : "call", ';
	postData += '"minutesSpent" : "'+ duration +'", ';
	postData += personalRef + ',';
	postData += '"comments" : "' + bg.getCallDirection() +' Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
	postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
	if (lc.getWrapUpCode() != 'false') {
		postData += 'Wrap-up Code: ' + lc.getWrapUpValue() + '\\r\\n\\r\\n';
	}
	if (lc.getCallNotes() != 'false') {
		postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
	}
	if (lc.getRecordingLinkBase()) {
		postData += 'Call Record Link:  '+ recLink + '?userID=' + bg.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
	}
	postData +=  '\\r\\n"}';

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
    			console.log("bullhorn__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("bullhorn__createIncident: ID == " + results.Id + "Description " + results.Description );

    			} else {
    				console.log("bullhorn__createIncident: Failed to Create a new Incident " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			//alert("bullhorn__createCallLog: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}
