'use strict'

const { remote, shell } = require('electron');

const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const util 	= require('../util/setCallData')
const ch 	= require('../util/callHistory')
const reset = require('../util/resetBackGroundData');
const ph 	= require('../util/phoneUtils')

const cloudElementsUrl = pjson.config.cloudElementsUrl;

///////////////////////////////////////////////////////////////
exports.zendesk__actionHandler = function(callState, json) {
	
	console.debug("zendesk__actionHandler : " + callState);
	console.debug("zendesk__actionHandler : " + JSON.stringify(json));

	if (json.type == 'incident') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		zendesk__createIncident();
	} else if (json.type == 'logcall') {
		console.log("zendesk__actionHandler : end of call");

		if (bg.getHistoryFlag()) {
			console.log("servicenow__actionHandler bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag(false);
		}
        bg.setCallState('CALL_END');
		
        if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
             console.log("zendesk__actionHandler: Wrap Up Codes or Call Notes Required");
			var json ={pageUrl: pjson.config.callnotes, callerName: bg.getCallerName()}
			ipcRenderer.send('open-utility-window', json);
        } else {
			reset.resetBackGroundData();
		} 
        
    } else if (json.type == 'saveNotes') {
        console.log("zendesk__actionHandler : savenotes ");
		zendesk__createCallLog(json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
			thisWindow.close()
    	});
	}
}
///////////////////////////////////////////////////////////////
function zendesk__createIncident() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/incidents';
	var header = lc.getCloudElementsId();
	console.debug("zendesk__createIncident: " + url);
	console.debug("zendesk__createIncident: " + header);
	
	var postData = '{ "description": "Fuze Connect Created Ticket ' + bg.getStarttime() + '", ';
	 	postData += '"status":"new", ';
		postData += '"organization_id": "' + bg.getAcctConnectorID() + '", ';
		postData += '"requester_id": "' + bg.getUserConnectorAcct() + '"}';

	console.log("zendesk__createIncident: " + postData + "\n\n\n\n\n");
	
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
    			console.log("zendesk__createIncident: resp.success == " + xhr.responseText);
    			console.log("zendesk__createIncident: xhr.status = " + xhr.status); 
				if (results.id) {
					bg.setActivityId(results.id);

					var openwinurl = lc.getCrmBaseUrl() + '/agent/tickets/' + results.id;
					console.debug("zendesk__createIncident: New Incident URL == " + openwinurl );
					shell.openExternal(openwinurl);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.debug("zendesk__createIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.debug("zendesk__createIncident: xhr.responseText = " + xhr.responseText);
    			console.debug("zendesk__createIncident: xhr.status = " + xhr.status); 
    			console.errror("zendesk__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
}
///////////////////////////////////////////////////////////////
function zendesk__createCallLog(endtime, callback) {


	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/' + lc.getContentPrimary() +'/' + bg.getActivityId() + '/comments';
	var header = lc.getCloudElementsId();
	
	console.debug("zendesk__createCallLog: url       " + postUrl);
	console.debug("zendesk__createCallLog: header    " + header);
	console.debug("zendesk__createCallLog: ID        " + bg.getActivityId());
	console.debug("zendesk__createCallLog: Direction " + bg.getCallDirection());
	console.debug("zendesk__createCallLog: starttime " + bg.getRawStartTime());
	console.debug("zendesk__createCallLog: endtime   " + endtime);
	console.debug("zendesk__createCallLog: wrap code  " + lc.getWrapUpCode());
	console.debug("zendesk__createCallLog: notes   	" + lc.getCallNotes());
	if (lc.getWrapUpCode() != 'false') {
		console.log("zendesk__createCallLog: Wrap Code " + bg.getWrapUpValue());
	}
	if (lc.getCallNotes() != 'false') {
		console.debug("zendesk__createCallLog: CallNotes " + bg.getNoteValue());
	}
	
	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.debug("zendesk__createCallLog: duration   " + duration);
	console.debug("zendesk__createCallLog: starttime   " + bg.getStarttime());
	console.debug("zendesk__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "type" : "comment", "public" : "false", ';
		postData += '"body" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '\\r\\n';
		postData += 'Start Time = ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time = ' + bg.getFormattedDate('mdy')+ '\\r\\n\\r\\n';
		if (lc.getWrapUpCode() != 'false') {
			postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
		}
		if (lc.getCallNotes() != 'false') {
			postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
			//postData = postData.replace(/(\r\n|\n|\r)/gm,"\\r\\n");
		}
		if (lc.getRecordingLinkBase()) {
			postData += 'Call Record Link:  '+ lc.getRecordingLinkBase()  + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
		} 
		postData +=  '\\r\\n"}';

	console.debug("zendesk__createCallLog  " + postUrl);
	console.debug("zendesk__createCallLog  " + postData);
	
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
    			console.debug("zendesk__Validate: resp.success == " + xhr.responseText);
				if (results.id) {
					bg.setActivityId(''); 
					var callLogId = results.id;
					var description = results.Description;
    			
    				console.debug("zendesk__createIncident: ID == " + results.id + "Description " + results.Description );
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("zendesk__createIncident: Failed to Create a new Incident " + postData );
    			}
    			callback();
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.debug("xhr.responseText = " + xhr.responseText);
    			console.debug("xhr.status = " + xhr.status); 
    			console.error("zendesk__createCallLog: Invalid CRM User" + xhr.responseText);
    			callback();
      		}
      	}  
  	}; 
	xhr.send(postData);
}
