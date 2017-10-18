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
exports.sfdc__actionHandler = function (callState, json) {
		
	console.log("sfdc__actionHandler : " + callState); 
	console.log("sfdc__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'activities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		sfdc__createActivity();
	} else if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before sfdc__createOpportunity : end of call");
		if ( lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'FocusVision'){
			 ipcRenderer.send('open-utility-window', pjson.config.focusurl);
		} else {
			sfdc__createOpportunity();
		}
	} else if (json.type == 'logcall') {
		console.log("sfdc__actionHandler : end of call");

		
		if (bg.getHistoryFlag()) {
			console.log("sfdc__actionHandler bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag(false);
		}
        bg.setCallState('CALL_END');
		
        if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
             console.log("sfdc__actionHandler: Wrap Up Codes or Call Notes Required");
            ipcRenderer.send('open-utility-window', pjson.config.callnotes);
        } 
    } else if (json.type == 'saveNotes') {
        console.log("sfdc___actionHandler : savenotes ");

		if (lc.getCrmType() == "Standard") {
			console.log("sfdc__actionHandler: before sfdc__createCallLogBigPayload");
			sfdc__createCallLogBigPayload(json.endtime, function() {
				reset.resetBackGroundData()
				var thisWindow = remote.getCurrentWindow();
    			thisWindow.close()
    		});
		} else if (lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'Houzz') {
			sfdc__createCallLogHouzzPayload(json.endtime, function() {
				reset.resetBackGroundData()
				var thisWindow = remote.getCurrentWindow();
    			thisWindow.close()
    		});
		} else if (lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'FocusVision') {
			sfdc__createCallLogBigPayload(json.endtime, function() {
				reset.resetBackGroundData()
				var thisWindow = remote.getCurrentWindow();
    			thisWindow.close()
    		});
		}
	}
}
            
///////////////////////////////////////////////////////////////
function sfdc__createActivity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/accounts/' + bg.getAcctConnectorID() + '/activities';
	var header = lc.getCloudElementsId();
	console.log("sfdc__createActivity: " + url);
	console.log("sfdc__createActivity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2) + 'T00:00:00.000+0000'; 
	
	console.log("sfdc__createActivity: " + datetime);

	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"DurationInMinutes": "60", ';
		postData += '"ActivityDateTime":"' + datetime + '", ';
		postData += '"WhoId": "' + bg.getUserConnectorAcct() + '"}';

	console.log("sfdc__createActivity: " + postData + "\n\n\n\n\n");
	
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
    			console.log("sfdc__createActivity: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var activityUrl = lc.getCrmBaseUrl() + '/' + results.Id;
					
					var new_window = window.open(activityUrl, 'New Activity' + results.Id);
    				console.log("sfdc__createActivity: New Activity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("sfdc__createActivity: Failed to Create a new Activity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("sfdc__createActivity: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}
/////////////////////////////////////////////////////////////////////////////////////////
function sfdc__searchForAccount(method, intAccount) {

	console.log("Method: " + method +  " | IntAccount: " + intAccount)
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/Intacct_Entity__c?where=(name=\'' +  intAccount + '\')';

	console.warn("sfdc__createFocusvisionOpportunity: url == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var results = JSON.parse( xhr.responseText );
				if (results.length > 0) {
					console.warn("Found Account ID: " + results[0].Id)
					sfdc__createFocusvisionOpportunity(method, results[0].Id);
				}
			}
		}

	}
	xhr.send(null);

}

/////////////////////////////////////////////////////////////////////////////////////////
function sfdc__createFocusvisionOpportunity(method, intAccount) {

	var url = cloudElementsUrl + '/' + lc.getRoutePath();
	url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("sfdc__createFocusvisionOpportunity: " + url);
	console.log("sfdc__createFocusvisionOpportunity: " + header);

	var currentdate = new Date();
	var datetime = currentdate.getFullYear() + 1 + '-'
		+ ('0' + (currentdate.getMonth() + 1)).slice(-2) + '-'
		+ ('0' + currentdate.getDate()).slice(-2);

	console.warn("sfdc__createActivity: " + datetime);

	var postData = '{ "Name":"' + bg.getStarttime() + ' - Temporary Description", ';
	postData += '"AccountId": "' + bg.getAcctConnectorID() + '", ';
	postData += '"StageName": "Prospecting", ';
	postData += '"Method_Type__c": "' + method + '", ';
	postData += '"Intacct_Entity__c": "' + intAccount + '", ';
	postData += '"CloseDate": "' + datetime + '"}';

	console.log("sfdc__createFocusvisionOpportunity: " + postData + "\n\n\n\n\n");

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Authorization", header);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				var results = JSON.parse(xhr.responseText);
				console.warn("sfdc__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;

					var new_window = window.open(incidentUrl, 'New Opportunity' + results.Id );
					console.warn("sfdc__createFocusvisionOpportunity: New Opportunity " + results.Id);
					bg.setCrmAuthStatus(true);
				} else {
					console.warn("sfdc__createFocusvisionOpportunity: Failed to Create a new Opportunity " + postData);
					bg.setCrmAuthStatus(true);
				}
			} else {
				//bg.setCrmAuthStatus(true);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
				alert("sfdc__Validate: Invalid CRM User" + xhr.responseText);
			}
		}
	};
	xhr.send(postData);

}


///////////////////////////////////////////////////////////////
function sfdc__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("sfdc__createOpportunity: " + url);
	console.log("sfdc__createOpportunity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.warn("sfdc__createActivity: " + datetime);

	var postData = '{ "Name":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"AccountId": "' + bg.getAcctConnectorID() + '", ';
		postData += '"StageName": "Discovery", ';
		postData += '"CloseDate": "' + datetime + '"}';

	console.log("sfdc__createOpportunity: " + postData + "\n\n\n\n\n");

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
    			console.log("sfdc__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;

					shell.openExternal(incidentUrl)

					console.log("sfdc__createOpportunity: New Opportunity " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("sfdc__createOpportunity: Failed to Create a new Opportunity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			//bg.setCrmAuthStatus(true);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("sfdc__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}
     
///////////////////////////////////////////////////////////////
function sfdc__createCallLog(endtime, postData, successCallback, failCallback) {

	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	var header = lc.getCloudElementsId();

	console.warn("sfdc__createCallLog: bg.getActivityId() " + bg.getActivityId())
	console.warn("sfdc__createCallLog: bg.getUserConnectorAcct() " + bg.getUserConnectorAcct())
	console.warn("sfdc__createCallLog: bg.getAcctConnectorID() " + bg.getAcctConnectorID())
	
	if ((bg.getActivityId() != 'false') &&  (bg.getActivityId() != null)) {
		console.log("sfdc__createCallLog: Call log against the " + lc.getContentPrimary() +  "  "+ lc.getContentPrimary() + ' ' + bg.getActivityId())
		postUrl += '/' + lc.getContentPrimary() +'/' + bg.getActivityId() + '/tasks';
	} else if ((bg.getUserConnectorAcct() != 'false') &&  (bg.getUserConnectorAcct() != null)) {
		console.log("sfdc__createCallLog: Call log against the Contact " + bg.getUserConnectorAcct())
		postUrl += '/contacts/' + bg.getUserConnectorAcct() + '/tasks';
		//entityId = '"WhoId": "' + bg.getUserConnectorAcct() + '" ,';
	} else if ((bg.getAcctConnectorID() != 'false') &&  (bg.getAcctConnectorID() != null)) {
		console.log("sfdc__createCallLog: Call log against the Account " +  bg.getAcctConnectorID() )
		postUrl += '/accounts/' + bg.getAcctConnectorID() + '/tasks';
	} else {
		console.log("Call log against the agent")
		postUrl += '/tasks';
	}

	console.log("sfdc__createCallLog " + postUrl);
	console.log("sfdc__createCallLog " + postData);

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
    			console.log("sfdc__createCallLog: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("sfdc__createCallLog: ID == " + results.Id + "Description " + results.Description );
	
    			} else {
    				console.log("sfdc__createCallLog: Failed to Create a new Log " + postData );
    			}
    			successCallback();
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			//alert("sfdc__createCallLog: Invalid CRM User" + xhr.responseText);
    			failCallback(endtime, successCallback);
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}

///////////////////////////////////////////////////////////////
function sfdc__createCallLogBigPayload(endtime, successCallback) {
	
	var recLink = lc.getRecordingLinkBase();
	
	console.log("sfdc__createCallLog: recLink   " + recLink);
	console.log("sfdc__createCallLog: ID        " + bg.getActivityId());
	console.log("sfdc__createCallLog: Direction " + bg.getCallDirection());
	console.log("sfdc__createCallLog: starttime " + bg.getRawStartTime());
	console.log("sfdc__createCallLog: endtime   " + endtime);
	console.log("sfdc__createCallLog: wrap code   " + lc.getWrapUpCode());
   	console.log("sfdc__createCallLog: notes   " + lc.getCallNotes());
   	if (lc.getWrapUpCode() !== 'false') {
   		console.log("sfdc__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (lc.getCallNotes() !== 'false') {
		console.log("sfdc__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("sfdc__createCallLog: duration   " + duration);
	console.log("sfdc__createCallLog: starttime   " + bg.getStarttime());
	console.log("sfdc__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"CallType" : "' + bg.getCallDirection() + '", ';
		postData += '"CallDurationInSeconds" : "'+ duration +'", ';
		if (((bg.getActivityId() === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct() === 'false') ||  (bg.getUserConnectorAcct() == null))) {
			postData += '"Status": "In Progress" ,';	
		} else {
			postData += '"Status": "Completed" ,';
		}
		postData += '"Type" : "Phone Call", ';
		postData += '"ActivityDate" : "' + bg.getFormattedDate('date') + '", ';
		postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
	if (((bg.getActivityId()  === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct()  === 'false') ||  (bg.getUserConnectorAcct() == null))) {

		postData += '\\r\\n';
		postData += 'Caller Name : ' + bg.getCallerName() + '\\r\\n';
		postData += 'Caller Number : ' + bg.getCallIdforUI() + '\\r\\n';
	}
	
	if (lc.getWrapUpCode() !== 'false') {
    	postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
    }
	if (lc.getCallNotes() !== 'false') {
    	postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
    }
    if (lc.getRecordingLinkBase()) {
    	postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
    }
    postData +=  '\\r\\n"}';
      
    sfdc__createCallLog(endtime, postData, successCallback, sfdc__createCallLogSmallgPayload);
}
///////////////////////////////////////////////////////////////
function sfdc__createCallLogSmallgPayload(endtime, successCallback) {

	var recLink = lc.getRecordingLinkBase();
	console.log("sfdc__createCallLog: recLink   " + recLink);
	console.log("sfdc__createCallLog: ID        " + bg.getActivityId());
	console.log("sfdc__createCallLog: Direction " + bg.getCallDirection());
	console.log("sfdc__createCallLog: starttime " + bg.getRawStartTime());
	console.log("sfdc__createCallLog: endtime   " + endtime);
	console.log("sfdc__createCallLog: wrap code " + lc.getWrapUpCode());
   	console.log("sfdc__createCallLog: notes     " + lc.getCallNotes());
   	if (lc.getWrapUpCode() !== 'false') {
   		console.log("sfdc__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (lc.getCallNotes()!== 'false') {
		console.log("sfdc__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("sfdc__createCallLog: duration   " + duration);
	console.log("sfdc__createCallLog: starttime   " + bg.getStarttime());
	console.log("sfdc__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"CallType" : "' + bg.getCallDirection() + '", ';
		postData += '"ActivityDate" : "' + bg.getFormattedDate('date') + '", ';
		postData += '"CallDurationInSeconds" : "'+ duration +'", ';
		if (((bg.getActivityId() === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct()  === 'false') ||  (bg.getUserConnectorAcct() == null))) {
			postData += '"Status": "In Progress" ,';
		} else {
			postData += '"Status": "Completed" ,';
		}
		postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
		
	if (((bg.getActivityId()  === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct() === 'false') ||  (bg.getUserConnectorAcct() == null))) {
		postData += '\\r\\n';
		postData += 'Caller Name : ' + bg.getCallerName() + '\\r\\n';
		postData += 'Caller Number : ' + bg.getCallIdforUI() + '\\r\\n';
	}
	
	if (lc.getWrapUpCode() !== 'false') {
    	postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
    }
	if (lc.getCallNotes() !== 'false') {
    	postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
    }
    if (lc.getRecordingLinkBase()) {
    	postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
    }
    postData +=  '\\r\\n"}';
      
    sfdc__createCallLog(endtime, postData, successCallback, successCallback);
}
///////////////////////////////////////////////////////////////
function sfdc__createCallLogHouzzPayload(endtime, successCallback) {

	var recLink = lc.getRecordingLinkBase();

	console.log("sfdc__createCallLog: recLink   " + recLink);
	console.log("sfdc__createCallLog: ID        " + bg.getActivityId());
	console.log("sfdc__createCallLog: Direction " + bg.getCallDirection());
	console.log("sfdc__createCallLog: starttime " + bg.getRawStartTime());
	console.log("sfdc__createCallLog: endtime   " + endtime);
	console.log("sfdc__createCallLog: wrap code   " + lc.getWrapUpCode());
	console.log("sfdc__createCallLog: notes   " + lc.getCallNotes());
	if (lc.getWrapUpCode() !== 'false') {
		console.log("sfdc__createCallLog: Wrap Code " + bg.getWrapUpValue());
	}
	if (lc.getCallNotes() !== 'false') {
		console.log("sfdc__createCallLog: CallNotes " + bg.getNoteValue());
	}

	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("sfdc__createCallLog: duration   " + duration);
	console.log("sfdc__createCallLog: starttime   " + bg.getStarttime());
	console.log("sfdc__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
	postData += '"CallType" : "' + bg.getCallDirection() + '", ';
	postData += '"CallDurationInSeconds" : "'+ duration +'", ';
	
	if (((bg.getActivityId() === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct() === 'false') ||  (bg.getUserConnectorAcct() == null))) {
		postData += '"Status": "In Progress" ,';
	} else {
		postData += '"Status": "Completed" ,';
	}	
	postData += '"Type" : "Call", ';
	postData += '"CallType__c" : "Call", ';
	if (lc.getWrapUpCode() !== 'false') {
		postData += '"CallDisposition" : "' + bg.getWrapUpValue() + '", ';
	}
	postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
	postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
	
	if (((bg.getActivityId()  === 'false') ||  (bg.getActivityId() == null)) && ((bg.getUserConnectorAcct() === 'false') ||  (bg.getUserConnectorAcct() == null))) {
		postData += '\\r\\n';
		postData += 'Caller Name : ' + bg.getCallerName() + '\\r\\n';
		postData += 'Caller Number : ' + bg.getCallIdforUI() + '\\r\\n';
	}
	
	if (lc.getWrapUpCode() !== 'false') {
		postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
	}
	if (lc.getCallNotes() !== 'false') {
		postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
	}
	if (lc.getRecordingLinkBase()) {
		postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
	}
	postData +=  '\\r\\n"}';

	sfdc__createCallLog(endtime, postData, successCallback, sfdc__createCallLogSmallgPayload);
}
