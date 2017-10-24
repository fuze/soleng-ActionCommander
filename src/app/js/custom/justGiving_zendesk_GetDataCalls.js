'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const ch = require('../callHandler')
const uh = require('../utilityHandler')
const bg = require('../generalSetGet')
const ph = require('../util/phoneUtils')
const util = require('../util/setCallData')

const cloudElementsUrl = pjson.config.cloudElementsUrl;

var _callHandled = false;
const phoneNumberPattern = ph.getPhonePatterns()
///////////////////////////////////////////////////////////////
exports.justGiving__callHandler = function(callState, json) {

	bg.setCallDirection(json.direction);
	
	console.log("justGiving__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("justGiving__callHandler: "+ callState +" Caller ID == " + json.direction);
	console.log("justGiving__callHandler: json.clid  Caller ID == " + json.clid);
	console.log("justGiving__callHandler: json.callid Caller ID == " + json.callid);
	
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);

		if (json.direction == "INBOUND")
			bg.justGiving__createNewIncident(json.clidname);

		justGiving__getContactByPhone(json, justGiving__handleCallResults);
	
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if ((callState == 'CALL_END') && (json.ringback !== 'true')) {
	
		console.log("justGiving__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};
////////////////////////////////////////////////////////////////////////////////////////
// @ Parm call bak ==  justGiving__handleCallResults
function justGiving__getContactByPhone(json, callback) {
	
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/contacts?where=(phone like \'%25' + internationalNumber + '\' or phone like \'%25' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';
	//url +=' or telephone=\'' + clid + '\' or telephone=\'' +  fmtCallId + '\'';
	var header = lc.getCloudElementsId();

	console.log("justGiving__getContactByPhone: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			
    			if (results.length <= 0) {
    				console.log("justGiving__getContactByPhone: " + xhr.responseText);
    				//justGiving__getAccountByPhone(json, justGiving__buildAccountListForGetContactByAccountId);
    				//Create a new Users Here?? 
    				bg.setContactRole('No Match Found');
    			} else {
    				bg.setCallerName(results[0].name);
    				bg.setContactRole('');
    				console.log("justGiving__getContactByPhone: " + JSON.stringify(xhr.responseText));
    				callback('incident', results, justGiving__getIncidentsByAccountId);
    			} 
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("justGiving__getContactByPhone: xhr.responseText = " + xhr.responseText);
    			console.log("justGiving__getContactByPhone: xhr.status = " + xhr.status);
      		}
      		console.log("justGiving__getContactByPhone: xhr.readyState = " + xhr.readyState);
      	}  
  		
	}
	xhr.send(null);
}


////////////////////////////////////////////////////////////////////////////////////////
// Call back == justGiving__getIncidentsByAccountId
function justGiving__handleCallResults(type, contacts) {

	var rowCount = contacts.length;
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();
	
	if (rowCount) {
    	anchorHead.dataRows.push({
    		"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
        	"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
       		"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
       		"rowend"   : 	'</tr>'
	    });
	}
	
	
	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		var name = contacts[i].name
		var acctId = contacts[i].organization_id;
		var id = contacts[i].id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = (contacts[i].hasOwnProperty('user_fields'))?(contacts[i].user_fields.organization_name):('');

    	 achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="incident"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
    justGiving__getIncidentsByAccountId(contacts);
}

////////////////////////////////////////////////////////////////////////////////////////
function justGiving__getIncidentsByAccountId(contacts) {
	console.log("\n\n\njustGiving__getIncidentsByAccountId == " + JSON.stringify(contacts));
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath() +'/incidents?where=organization_id=\'';
	var acctId = 'null';
	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		if (acctId == 'null') {
			url += contacts[i].organization_id + '\'';
			acctId = contacts[i].organization_id;
		} else if (acctId != contacts[i].organization_id) {
			url += 'or organization_id=\'' + contacts[i].organization_id + '\'';
		}
	}
	url += ' and (status = \'new\' or status = \'open\' or status = \'pending\')&includeDeleted=false';
	//"status": "closed"
	console.log("\n\n\njustGiving__getIncidentsByAccountId == " + url);
	var header = lc.getCloudElementsId();
	
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("justGiving__getIncidentsByAccountId == " + xhr.status)
				console.log("justGiving__getIncidentsByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
    			//console.log("justGiving__getAccountById == " + acctId);
    			console.log("JSON == " + JSON.stringify(resp));
    			console.log("\n\n\n");
    			justGiving__handleIncidentResults(resp);
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
////////////////////////////////////////////////////////////////////////////////////////
function justGiving__handleIncidentResults(incidents) {
	
	var incidentUrl;
	var rowCount = incidents.length;
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	
	if (rowCount) {
    	theadJson.dataRows.push({
    		"rowstart" : 	'<tr id="remove-' + (rowCount + 1)  + '">',
			"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Incident</th>',
       		"cell_2"   : 	'<th id="content-head-4" class="contacts-table">Description</th>',
       		"cell_3"   : 	'<th id="content-head-2" class="contacts-table">Status</th>',
       		"rowend"   : 	'</tr>'
	    });
	}
	
	for ( var i = 0; i <= (incidents.length - 1);  i++) {
		var status = incidents[i].status;
		var casenumber = incidents[i].id;
		var subject = incidents[i].description;
		var id = incidents[i].id;
		incidentUrl = lc.getCrmBaseUrl() + '/agent/tickets/' + id;

		console.log("justGiving__handleIncidentResults: URL == " + id);
		
		contentJson.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '" class="contacts-table-name">' + casenumber + '</td>',
       		"cell_2"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">' + subject + '</td>',
       		"cell_3"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">'+ status + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    if (rowCount == 1) {
		
		console.log("justGiving__handleIncidentResults: URL == " + incidentUrl);
		var new_window = window.open(incidentUrl, 'Case Number ' + casenumber);
		new_window.focus();
	
	} else  if (rowCount > 1) {
		console.log('justGiving__handleIncidentResults: tblstr ' + contentJson);
		console.log('justGiving__handleIncidentResults: tblstr ' + JSON.stringify(contentJson));
	}
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
} 

