'use strict'

const { remote, ipcRenderer } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');
const ph = require('../util/phoneUtils')

const cloudElementsUrl = pjson.config.cloudElementsUrl;

///////////////////////////////////////////////////////////////
exports.servicenow__actionHandler = function(callState, json) {
	
	console.debug("servicenow__actionHandler : " + callState); 
	console.debug("servicenow__actionHandler : " + JSON.stringify(json));
		
	if (json.type == 'incident') {
		bg.setUserConnectorAcct(json.uid);
		console.debug("UserConnectorAcct " + bg.getUserConnectorAcct());
		console.debug("UserConnectorAcct phone == " + ph.getPhoneNumberPattern(bg.getRawCallId(), phoneNumberPattern.National));
		console.debug("UserConnectorAcct URL == " + lc.getCrmBaseUrl());
		bg.setAcctConnectorID(json.acctid);
		servicenow__createIncident();
	} else if (json.type == 'logcall') {
		console.log("servicenow__actionHandler : end of call");

		
		if (bg.getHistoryFlag()) {
			console.log("servicenow__actionHandler bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag(false);
		}
        bg.setCallState('CALL_END');
		
        if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
             console.log("servicenow__actionHandler: Wrap Up Codes or Call Notes Required");
            ipcRenderer.send('open-utility-window', pjson.config.callnotes);
        } else {
			reset.resetBackGroundData();
		} 
        
    } else if (json.type == 'saveNotes') {
        console.log("servicenow__actionHandler : savenotes ");
		servicenow__createCallLog(json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
			thisWindow.close()
    	});
	}
}
		
///////////////////////////////////////////////////////////////
function servicenow__createIncident() {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/incidents';
	var fmtPhone = ph.getPhoneNumberPattern(bg.getRawCallId(), phoneNumberPattern.National);
	var linkurl = lc.getCrmBaseUrl() +'/api/now/v1/table/sys_user/' + bg.getUserConnectorAcct();
	
	var header = lc.getCloudElementsId();
	console.log("servicenow__createIncident: " + url);
	console.log("servicenow__createIncident: " + header);
	console.log("servicenow__createIncident: " + linkurl);
	console.log("servicenow__createIncident: " + linkurl);
	
	var postData = '{ "short_description":"' + bg.getStarttime() + ' - Temporary Description", ';
	 	postData += '"Status":"Open", "Origin":"Phone", ';
		postData += '"caller_id": { "display_value": "' + fmtPhone + '", ';
		postData += '"link": "' + linkurl + '" } }';
		
	console.log("servicenow__createIncident: " + postData );
	
	
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
    			console.log("servicenow__createIncident: resp.success == " + xhr.responseText);
				if (results.sys_id) {
					bg.setActivityId(results.sys_id);
					var incidentUrl = lc.getCrmBaseUrl() + '/nav_to.do?uri=/incident.do?sys_id=' + results.sys_id;
					
					var new_window = window.open(incidentUrl, 'New Incident');
    				console.log("servicenow__createIncident: New Incident " + results.sys_id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("servicenow__createIncident: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("servicenow__Validate: Invalid CRM User" + xhr.responseText);
      		}
      	}  
  	}; 
	xhr.send(postData);
	
}
///////////////////////////////////////////////////////////////
function servicenow__createCallLog(endtime, callback) {

	var recLink = lc.getRecordingLinkBase();
	
	var postUrl = cloudElementsUrl + '/' + lc.getRoutePath();
	    postUrl += '/' + lc.getContentPrimary() +'/' + bg.getActivityId() + '/work-notes';
	var header = lc.getCloudElementsId();
	
	console.log("servicenow__createCallLog: recLink   " + recLink);
	console.log("servicenow__createCallLog: url       " + postUrl);
	console.log("servicenow__createCallLog: header    " + header);
	console.log("servicenow__createCallLog: ID        " + bg.getActivityId());
	console.log("servicenow__createCallLog: Direction " + bg.getCallDirection());
	console.log("servicenow__createCallLog: starttime " + bg.getRawStartTime());
	console.log("servicenow__createCallLog: endtime   " + endtime);
	console.log("servicenow__createCallLog: wrap code   " + lc.getWrapUpCode());
	console.log("servicenow__createCallLog: notes   " + lc.getCallNotes());
	if (lc.getWrapUpCode() !== false) {
		console.log("servicenow__createCallLog: Wrap Code " + bg.getWrapUpValue());
	}
	if (lc.getCallNotes() !== false) {
		console.log("servicenow__createCallLog: CallNotes " + bg.getNoteValue());
	}
	
	var duration = Math.round((endtime - bg.getRawStartTime()) / 1000);
	console.log("servicenow__createCallLog: duration   " + duration);
	console.log("servicenow__createCallLog: starttime   " + bg.getStarttime());
	console.log("servicenow__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var postData = '{ "work_notes" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime();
		postData +=  '\\r\\n\\r\\n'
		postData += 'Start Time          : ' + bg.getStarttime() + '\\r\\n';
		postData += 'End Time            : ' + bg.getFormattedDate('mdy') + '\\r\\n';
		postData += 'Duration In Seconds : ' + duration + '\\r\\n\\r\\n';
		if (lc.getWrapUpCode() != 'false') {
			postData += 'Wrap-up Code: ' + bg.getWrapUpValue() + '\\r\\n\\r\\n';
		}
		if (lc.getCallNotes() !== false) {
			postData += 'Notes: ' + bg.getNoteValue() + '\\r\\n\\r\\n';
		}
		if (lc.getRecordingLinkBase()) {
			postData += 'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket();
		} 
		postData +=  '\\r\\n"}';

	console.error("servicenow__createCallLog" + postData);
	console.error("servicenow__createCallLog " + postUrl);
	
	
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
    			console.log("servicenow__createCallLog: resp.success == " + xhr.responseText);
				if (results.Id) {
					bg.setActivityId(''); 
					var callLogId = results.sys_id;
					var description = results.Description;
    			
    				console.log("servicenow__createCallLog: ID == " + results.Id + "Description " + results.Description );
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    				console.log("servicenow__createCallLog:  " + postData );
    			}
    			callback();
      		} else { 
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			//alert("servicenow__createCallLog: Invalid CRM User" + xhr.responseText);
    			callback();
      		}
      	}  
  	}; 
	xhr.send(postData);
}
