'use strict'

const { remote, shell } = require('electron');
const pjson = remote.getGlobal('pjson')
const mainWindow = remote.getGlobal('mainWindow')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg 	= require('../generalSetGet')
const lc 	= require('../localConfigSettings');
const util = require('../util/setCallData')
const ch = require('../util/callHistory')
const reset = require('../util/resetBackGroundData');

const recordingAttempts  = pjson.config.recordingAttempts;
const recordingDelayTime = pjson.config.recordingDelayTime;
const callRecordingURL = pjson.config.callRecordingURL;

const cloudElementsUr = pjson.config.cloudElementsUrl;


///////////////////////////////////////////////////////////////
exports.msdynamics__actionHandler = function(callState, json) {
		
	console.log("msdynamics__actionHandler : " + callState);
	console.log("msdynamics__actionHandler : " + JSON.stringify(json));
	
	if (json.type == 'activities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		msdynamics__createActivity('full');
	} else if (json.type == 'opportunities') {
		bg.setUserConnectorAcct(json.uid);
		bg.setAcctConnectorID(json.acctid);
		console.log("before msdynamics__createOpportunity : end of call");
		msdynamics__createOpportunity('full');
	} else if (json.type == 'logcall') {
		console.log("msdynamics__actionHandler : end of call");

       if (bg.getHistoryFlag() == 'true') {
			console.log("bg.getHistoryFlag() == true");
			ch.createCallHistory();
			bg.setHistoryFlag('false');
		}
        bg.setCallState('CALL_END');
        
         if ((bg.getActivityId() != 'false') &&  (bg.getActivityId() !== null)) {
        	if ((lc.getWrapUpCode() !== false || lc.getCallNotes() !== false ) && (bg.getWrapUpValue() == '__blank__' || !bg.getNoteValue() == '__blank__' )) {
                console.log("sfdc__actionHandler: Wrap Up Codes or Call Notes Required");
                ipcRenderer.send('open-utility-window', pjson.config.callnotes);
            } 
        } 
     } else if (json.type == 'saveNotes') {
        console.log("sfdc___actionHandler : savenotes ");

		msdynamics__createCallLog('full', json.endtime, function() {
			reset.resetBackGroundData()
			var thisWindow = remote.getCurrentWindow();
    		thisWindow.close()
    	});
	}
}

///////////////////////////////////////////////////////////////
function msdynamics__createActivity(type) {

	var postData;
	var url = cloudElementsUr +  '/' + lc.getRoutePath();
	    url += '/tasks';
	var header = lc.getCloudElementsId();
	console.log("msdynamics__createActivity: " + url);
	console.log("msdynamics__createActivity: " + header);
	
	var currentdate = (new Date).getTime();
	if (type === 'full') {
		postData = '{"attributes":'
		postData +=	'{"subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"regardingobjectid": "' + bg.getAcctConnectorID() + '", ';
		postData += '"actualdurationminutes": "60", ';
		postData += '"activitytypecode": "task", ';
		postData += '"scheduledstart": "' + currentdate + '"}';
		postData += '}';
	} else {
		postData = '{"attributes":'
		postData +=	'{"subject":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"actualdurationminutes": "60", ';
		postData += '"activitytypecode": "task", ';
		postData += '"scheduledstart": "' + currentdate + '"}';
		postData += '}';
	}
	// {
	// 	"attributes": {
	//		"regardingobjectid":"16a72404-a2dc-e611-8100-5065f38a4bd2",
	// 		"subject": "batatas3",
	// 		"actualdurationminutes": 30,
	// 		"activitytypecode": "task",
	// 		"scheduledstart": 1485867600000
	// }
	// }

	console.log("msdynamics__createActivity: " + postData + "\n\n\n\n\n");
	
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
    			console.log("msdynamics__createActivity: resp.success == " + xhr.responseText);
				if (results.id) {
					bg.setActivityId(results.Id);
					var activityUrl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=task&id=' + results.id;

					shell.openExternal(activityUrl)
					console.log("msdynamics__createActivity: New Activity " + results.id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				msdynamics__createActivity('small')
    				alert("Failed to Create Activity with Relationship\nDue Microsoft Data Dctionary Error\nPlease Create Relationship Manually");
					bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			msdynamics__createActivity('small')
      			alert("Failed to Create Activity with Relationship\nDue Microsoft Data Dctionary Error\nPlease Create Relationship Manually");
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
      		}
      	}  
  	}; 
	xhr.send(postData);
}

///////////////////////////////////////////////////////////////
function msdynamics__createOpportunity(type) {
	
	var postData;
	var url = cloudElementsUr +  '/' + lc.getRoutePath();
	    url += '/opportunities';
	var header = lc.getCloudElementsId();
	console.log("msdynamics__createOpportunity: " + url);
	console.log("msdynamics__createOpportunity: " + header);
	
	var currentdate = (new Date).getTime();
	if (type === 'full') {
		postData = '{"attributes":'
		postData += '{"parentaccountid": "' + bg.getAcctConnectorID() + '", ';
		postData += '"salesstagecode": "1", ';
		postData +=	'"name":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"actualclosedate": "' + currentdate + '"}';
		postData += '}';
	} else {
		postData = '{"attributes":'
		postData += '{"salesstagecode": "1", ';
		postData +=	'"name":"' + bg.getStarttime() + ' - Temporary Description", ';
		postData += '"actualclosedate": "' + currentdate + '"}';
		postData += '}';
	}
	/*
	 {
	 	"attributes": {
	 	"parentaccountid": "16a72404-a2dc-e611-8100-5065f38a4bd2",
	 		"salesstagecode": 1,
	 		"name": "Bullhorn integration",
	 		"actualclosedate": "1485172278"
	 }
	 }
	*/
	
	console.log("msdynamics__createOpportunity: " + postData + "\n\n\n\n\n");

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
    			console.log("msdynamics__createOpportunity: resp.success == " + xhr.responseText);
				if (results.id) {
					bg.setActivityId(results.id);
					var opportunityUrl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=opportunity&id=' + results.id;

					shell.openExternal(opportunityUrl)
    				console.log("msdynamics__createOpportunity: New Opp " + results.id);
    				bg.setCrmAuthStatus(true);
    			} else {
    				msdynamics__createOpportunity('small');
    				alert("Failed to Create Opportunity with Relationship\nDue Microsoft Data Dctionary Error\nPlease Create Relationship Manually");
    				console.log("msdynamics__createOpportunity: Failed to Create a new Incident " + postData );
					bg.setCrmAuthStatus(true);
    			}
      		} else {
      			msdynamics__createOpportunity('small');
      			alert("Failed to Create Opportunity with Relationship\nDue Microsoft Data Dctionary Error\nPlease Create Relationship Manually");
      			//bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
      		}
      	}  
  	}; 
	xhr.send(postData);

}
///////////////////////////////////////////////////////////////
//function msdynamics__createCallLog(type, endtime, callback) {
function msdynamics__createCallLog(type, endtime, callback) {


	var postData;
	var recLink = lc.getRecordingLinkBase();

	var postUrl = cloudElementsUr + '/' + lc.getRoutePath();
		postUrl += '/tasks';

	var header = lc.getCloudElementsId();
	
	
	console.log("msdynamics__createCallLog: recLink   " + recLink);
	console.log("msdynamics__createCallLog: url       " + postUrl);
	console.log("msdynamics__createCallLog: header    " + header);
	console.log("msdynamics__createCallLog: ID        " + bg.getActivityId());
	console.log("msdynamics__createCallLog: Direction " + bg.getCallDirection());
	console.log("msdynamics__createCallLog: starttime " + bg.getRawStartTime());
	console.log("msdynamics__createCallLog: endtime   " + endtime);
	console.log("msdynamics__createCallLog: wrap code   " + lc.getWrapUpCode());
   	console.log("msdynamics__createCallLog: notes   " + lc.getCallNotes());
   	if (lc.getWrapUpCode() !== false) {
   		console.log("msdynamics__createCallLog: Wrap Code " + bg.getWrapUpValue());
   	}
	if (lc.getCallNotes() !== false) {
		console.log("msdynamics__createCallLog: CallNotes " + bg.getNoteValue());
	}

	
	var duration = Math.round(((endtime - bg.getRawStartTime()) / 1000)/60);
	console.log("msdynamics__createCallLog: duration   " + duration);
	console.log("msdynamics__createCallLog: starttime   " + bg.getStarttime());
	console.log("msdynamics__createCallLog: endtime   " + bg.getFormattedDate('mdy'));

	var description = '';
	if (lc.getWrapUpCode() != 'false') {
		description += 'Wrap-up Code : ' + bg.getWrapUpValue() + '\\r\\n';
	}
	if (lc.getCallNotes() != 'false') {
		description += 'Call Notes : ' + bg.getNoteValue() + '\\r\\n';
	}
	if (lc.getRecordingLinkBase()) {
		description +=  'Call Record Link:  '+ recLink + '?userID=' + lc.getTrimmedUsername() + '&callId=' + bg.getCallIdFromSocket() + '\\r\\n';
	}

	if (type === 'full') {
		
		postData = '{"attributes":'
		postData += '{"subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"regardingobjectid": "' + bg.getAcctConnectorID() + '", ';
		postData += '"actualdurationminutes": "' + duration + '", ';
		postData += '"activitytypecode": "phonecall", ';
		postData += '"actualstart": "' +  bg.getRawStartTime() + '", ';
		postData += '"actualend": "' +  endtime + '", ';
		postData += '"statuscode": "5", ';
		postData += '"description" : "' + description + '"}';
		postData += '}';
	} else {
		postData = '{"attributes":'
		postData += '{"subject" : "' + bg.getCallDirection() +' Automatic Call Log ' + bg.getStarttime() + '" , ';
		postData += '"actualdurationminutes": "' + duration + '", ';
		postData += '"activitytypecode": "phonecall", ';
		postData += '"actualstart": "' +  bg.getRawStartTime() + '", ';
		postData += '"actualend": "' +  endtime + '", ';
		postData += '"description" : "' + description + '"}';
		postData += '}';
	}

	console.log("msdynamics__createCallLog" + postData);
	
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
    			console.log("msdynamics__createCallLog: resp.success == " + xhr.responseText);
				if (results.id) {
					bg.setActivityId(''); 
					var callLogId = results.id;
					var description = results.attributes.description;
    			
    				console.log("msdynamics__createCallLog: ID == " + results.id + "Description " + description );
    				//msdynamics__updateCallLog(callLogId, description, bg.getCallIdFromSocket());
    				//msdynamics__dispatchUpdateCallLog(callLogId, 0, msdynamics__updateCallLog)
    				var activityUrl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=task&id=' + results.id;
    				shell.openExternal(activityUrl)
    				//var new_window = window.open(activityUrl, 'New Call Log' + results.id);
    				bg.setCrmAuthStatus(true);
    				callback();
    			} else {
    				
    				var buttons = [ 'OK'];
					remote.dialog.showMessageBox(mainWindow, { 
						type: 'error', 
						buttons: buttons, 
						message: "Warrning\nFailed to Create Call Log\nPlease Create Call Log and Relationship Manually"
					},  function() {
						msdynamics__createCallLog('small', endtime, callback);
					});
    				console.error("msdynamics__createCallLog: Failed to Create a new Incident " + postData );
    			}
      		} else {
      			var buttons = [ 'OK'];
					remote.dialog.showMessageBox(mainWindow, { 
						type: 'error', 
						buttons: buttons, 
						message: "Warrning\nFailed to Create Call Log with Relationship\nDue Microsoft Data Dctionary Error\nPlease Create Relationship Manually"
					},  function() {
						msdynamics__createCallLog('small', endtime, callback);
					});
      		}
      	}  
  	}; 
	xhr.send(postData);
}
