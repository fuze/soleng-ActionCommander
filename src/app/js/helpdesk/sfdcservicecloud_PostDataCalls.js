'use strict'

const { remote, shell, ipcRenderer } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');
const ph = require('../util/phoneUtils')

const cloudElementsUrl = pjson.config.cloudElementsUrl;


///////////////////////////////////////////////////////////////
exports.sfdcservicecloud__actionHandler = function (callState, json) {
	
	console.log("sfdcservicecloud__actionHandler : " + callState); 
	console.log("sfdcservicecloud__actionHandler : " + JSON.stringify(json));
		
	if (json.type == 'incident') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		sfdcservicecloud__createIncident();
	} else if (json.type == 'logcall') {
		console.log("sfdc__actionHandler : end of call");

		
		if (bg.getHistoryFlag()) {
			console.log("sfdcservicecloud__actionHandler bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag(false);
		}
        bg.setCallState('CALL_END');
		
        if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
             console.log("sfdcservicecloud__actionHandler: Wrap Up Codes or Call Notes Required");
			var json ={pageUrl: pjson.config.callnotes, callerName: bg.getCallerName()}
			ipcRenderer.send('open-utility-window', json);
        } else {
			reset.resetBackGroundData();
		} 
    } else if (json.type == 'saveNotes') {
        console.log("sfdcservicecloud__actionHandler : savenotes ");
		sfdcservicecloud__createCallLog(json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
    		thisWindow.close()
    	});
	}
}

///////////////////////////////////////////////////////////////
function sfdcservicecloud__createIncident() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/incidents';
	var header = lc.getCloudElementsId();
	console.log("sfdcservicecloud__createIncident: " + url);
	console.log("sfdcservicecloud__createIncident: " + header);
	
	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
	 	postData += '"Status":"Open", "Origin":"Phone", ';
		postData += '"AccountId": "' + bg.getAcctConnectorID() + '", ';
		postData += '"ContactId": "' + bg.getUserConnectorAcct() + '"}';

	console.log("sfdcservicecloud__createIncident: " + postData + "\n\n\n\n\n");
	
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
    			console.log("sfdcservicecloud__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/' + results.Id;

					shell.openExternal(incidentUrl)
    				console.log("sfdcservicecloud__createIncident: New Incident " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("sfdcservicecloud__createIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("sfdcservicecloud__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function sfdcservicecloud__createCallLog(endtime, callback) {

	var recLink = lc.getRecordingLinkBase();
	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();

	if ((bg.getActivityId() != 'false') &&  (bg.getActivityId() != null)) {
		console.log("sfdcservicecloud__createCallLog: Call log against the " + lc.getContentPrimary() +  "  "+ lc.getContentPrimary() + ' ' + bg.getActivityId())
		postUrl += '/' + lc.getContentPrimary() +'/' + bg.getActivityId() + '/tasks';
	} else if ((bg.getUserConnectorAcct() != 'false') &&  (bg.getUserConnectorAcct() != null)) {
		console.log("sfdcservicecloud__createCallLog: Call log against the Contact " + bg.getUserConnectorAcct())
		postUrl += '/contacts/' + bg.getUserConnectorAcct() + '/tasks';
		//entityId = '"WhoId": "' + bg.getUserConnectorAcct() + '" ,';
	} else if ((bg.getAcctConnectorID() != 'false') &&  (bg.getAcctConnectorID() != null)) {
		console.log("sfdcservicecloud__createCallLog: Call log against the Account " +  bg.getAcctConnectorID() )
		postUrl += '/accounts/' + bg.getAcctConnectorID() + '/tasks';
	} else {
		console.log("Call log against the agent")
		postUrl += '/tasks';
	}

	var header = lc.getCloudElementsId();
	
	console.log("sfdcservicecloud__createCallLog: recLink   " + recLink);
	console.log("sfdcservicecloud__createCallLog: url       " + postUrl);
	console.log("sfdcservicecloud__createCallLog: header    " + header);
	console.log("sfdcservicecloud__createCallLog: ID        " + bg.getActivityId());
	console.log("sfdcservicecloud__createCallLog: Direction " + bg.getCallDirection());
	console.log("sfdcservicecloud__createCallLog: starttime " + bg.getRawStartTime());
	console.log("sfdcservicecloud__createCallLog: endtime   " + endtime);
	console.log("sfdcservicecloud__createCallLog: wrap code   " + lc.getWrapUpCode());
	console.log("sfdcservicecloud__createCallLog: notes   " + lc.getCallNotes());
	if (lc.getWrapUpCode() != 'false') {
		console.log("sfdcservicecloud__createCallLog: Wrap Code " + bg.getWrapUpValue());
	}
	if (lc.getCallNotes() != 'false') {
		console.log("sfdcservicecloud__createCallLog: CallNotes " + bg.getNoteValue());
	}
	
	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("sfdcservicecloud__createCallLog: duration   " + duration);
	console.log("sfdcservicecloud__createCallLog: starttime   " + bg.getStarttime());
	console.log("sfdcservicecloud__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"CallType" : "' + bg.getCallDirection() + '", ';
		postData += '"CallDurationInSeconds" : "'+ duration +'", ';
		postData += '"Status": "Completed" ,';
		postData += '"Type" : "Phone Call", ';
		//postData += '"ActivityDate" : "' + bg.getFormattedDate('date') + '", ';
		postData += '"Description" : "Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy')+ '\\r\\n\\r\\n';
		if (lc.getWrapUpCode() != 'false') {
			postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
		}
		if (lc.getCallNotes() != 'false') {
			postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
			//postData = postData.replace(/(\r\n|\n|\r)/gm,"\\r\\n");
		}
		if (lc.getRecordingLinkBase()) {
			postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
		} 
		postData +=  '\\r\\n"}';

	console.log("sfdcservicecloud__createCallLog" + postData);
	
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
    			console.log("sfdcservicecloud__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("sfdcservicecloud__createIncident: ID == " + results.Id + "Description " + results.Description );
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("sfdcservicecloud__createIncident: Failed to Create a new Incident " + postData );
    			}
    			callback();
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("sfdcservicecloud__createCallLog: Invalid CRM User" + xhr.responseText);
    			callback();
      		}
      	}  
  	}; 
	xhr.send(postData);
}
