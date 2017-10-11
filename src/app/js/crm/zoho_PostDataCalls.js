'use strict'
const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const util = require('../util/setCallData')
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');


const cloudElementsUrl = pjson.config.cloudElementsUrl;

///////////////////////////////////////////////////////////////
exports.zoho__actionHandler = function(callState, json) {
		
	console.log("zoho__actionHandler : " + callState);
	console.log("zoho__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'activities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		zoho__createActivity();
	} else if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before zoho__createOpportunity : end of call");
		zoho__createOpportunity();
	} else if (json.type == 'logcall') {
		console.log("zoho__actionHandler : end of call");

       if (bg.getHistoryFlag() == 'true') {
			console.log("bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag('false');
		}
        bg.setCallState('CALL_END');
        if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
        	console.log("zoho__actionHandler: Wrap Up Codes or Call Notes Required");
            ipcRenderer.send('open-utility-window', pjson.config.callnotes);
        }

      } else if (json.type == 'saveNotes') {
        console.log("sfdc___actionHandler : savenotes ");

		zoho__createCallLog(json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
    		thisWindow.close()
    	});
	}
}

///////////////////////////////////////////////////////////////
function zoho__createActivity() {
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url += '/activities-calls';

	var header = lc.getCloudElementsId();
	console.log("zoho__createActivity: " + url);
	console.log("zoho__createActivity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2) + 'T00:00:00.000+0000'; 
	
	console.log("zoho__createActivity: " + datetime);

	var postData = '{ "Subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"Call Duration (in seconds)": "3600", ';
		postData += '"Call Start Time":"' + bg.getStarttime() + '", ';
	if(bg.getAcctConnectorID()!="lead") {
		postData += '"RELATEDTOID": "' + bg.getAcctConnectorID() + '", ';
	}
		postData += '"CONTACTID":"' + bg.getUserConnectorAcct() + '"}';

	console.log("zoho__createActivityCall: " + postData + "\n\n\n\n\n");
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("Content-Type", "application/json");   
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			results = JSON.parse( xhr.responseText );
    			console.log("zoho__Validate: resp.success == " + xhr.responseText);
				if (results.ACTIVITYID) {
					bg.setActivityId(results.Id);
					var activityUrl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Calls&id=' + results.ACTIVITYID;

					var new_window = window.open(activityUrl, 'New Activity' + results.ACTIVITYID);
    				console.log("zoho__createActivity: New Incident " + results.Id + " url: " + activityUrl);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("zoho__createActivity: Failed to Create a new Activity " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("zoho__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function zoho__createOpportunity() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("zoho__createOpportunity: " + url);
	console.log("zoho__createOpportunity: " + header);
	
	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + '-' 
				+ ('0' + (currentdate.getMonth()+1)).slice(-2) + '-' 
				+ ('0' + currentdate.getDate()).slice(-2); 
	
	console.log("zoho__createActivity: " + datetime);

	var postData = '{ "Potential Name":"' + bg.getStarttime() + ' - Temporary Description", ';

	if(bg.getAcctConnectorID()!="lead") {
		postData += '"ACCOUNTID": "' + bg.getAcctConnectorID() + '", ';
	}

		postData += '"Stage": "Qualification", ';
		postData += '"Closing Date": "' + datetime + '"}';

	console.log("zoho__createOpportunity: " + postData + "\n\n\n\n\n");

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
    			console.log("zoho__Validate: resp.success == " + xhr.responseText);
				if (results.POTENTIALID) {
					bg.setActivityId(results.Id);
					var incidentUrl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Potentials&id=' + results.POTENTIALID;
					
					var new_window = window.open(incidentUrl, 'New Incident' + results.POTENTIALID );
    				console.log("zoho__createIncident: New Incident " + results.Id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("zoho__createIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("zoho__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);

}
///////////////////////////////////////////////////////////////
function zoho__createCallLog(endtime, callback) {

	var recLink = lc.getRecordingLinkBase();
	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/' + lc.getContentPrimary() +'/' + bg.getActivityId() + '/tasks';
	var header = lc.getCloudElementsId();
	
	
	console.log("zoho__createCallLog: recLink   " + recLink);
	console.log("zoho__createCallLog: url       " + postUrl);
	console.log("zoho__createCallLog: header    " + header);
	console.log("zoho__createCallLog: ID        " + bg.getActivityId());
	console.log("zoho__createCallLog: Direction " + bg.getCallDirection());
	console.log("zoho__createCallLog: starttime " + bg.getRawStartTime());
	console.log("zoho__createCallLog: endtime   " + endtime);
	console.log("zoho__createCallLog: wrap code   " + lc.getWrapUpCode());
   	console.log("zoho__createCallLog: notes   " + lc.getCallNotes());
   	if (lc.getWrapUpCode() != 'false') {
   		console.log("zoho__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (lc.getCallNotes() != 'false') {
		console.log("zoho__createCallLog: CallNotes " + bg.getNoteValue());
	}

	
	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("zoho__createCallLog: duration   " + duration);
	console.log("zoho__createCallLog: starttime   " + bg.getStarttime());
	console.log("zoho__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "Subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"Call Type" : "' + bg.getCallDirection() + '", ';
		postData += '"Call Duration (in seconds)" : "'+ duration +'", ';
		postData += '"Call Status": "Completed" ,';
		postData += '"Description" : "Phone Call: Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy') + '\\r\\n';
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

	console.log("zoho__createCallLog" + postData);
	
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
    			console.log("zoho__Validate: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.Id;
					var description = results.Description;
    			
    				console.log("zoho__createIncident: ID == " + results.Id + "Description " + results.Description );
    				//zoho__updateCallLog(callLogId, description, bg.getCallIdFromSocket());
    				//zoho__dispatchUpdateCallLog(callLogId, 0, zoho__updateCallLog)
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("zoho__createIncident: Failed to Create a new Incident " + postData );
    			}
    			callback();
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("zoho__createCallLog: Invalid CRM User" + xhr.responseText);
    			callback();
      		}
      	}  
  	}; 
	xhr.send(postData);
}
