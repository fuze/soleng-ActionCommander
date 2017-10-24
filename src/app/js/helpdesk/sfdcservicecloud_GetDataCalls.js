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
exports.sfdcservicecloud__callHandler = function(callState, json) {

	bg.setCallDirection(json.direction);
	
	console.log("sfdcservicecloud__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("sfdcservicecloud__callHandler: "+ callState +" Caller ID == " + json.direction);
	console.log("sfdcservicecloud__callHandler: json.clid  Caller ID == " + json.clid);
	console.log("sfdcservicecloud__callHandler: json.callid Caller ID == " + json.callid);
	
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		sfdcservicecloud__getContactByPhone(json, sfdcservicecloud__getAccountByPhone, sfdcservicecloud__getAccountForContactResults);
				
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {
	
		console.log("sfdcservicecloud__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};

////////////////////////////////////////////////////////////////////////////////////////
// sfdcservicecloud__getContactByPhone
// Finds the Company Name for a given phone number
//
// @parm json 				== Call Data JSON Packet;
// @parm failCallBack 		== sfdcservicecloud__getAccountByPhone
// @parm successCallBack 	== sfdcservicecloud__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__getContactByPhone(json, failCallBack, successCallBack) {
	
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/contacts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\'';
	url +=' or MobilePhone like \'%25' + internationalNumber + '\' or MobilePhone like \'%25' +  internationalRawNumber + '\' or MobilePhone=\'' +  nationalNumber + '\' or MobilePhone=\'' +  nationalRawNumber + '\')';

	console.log("sfdcservicecloud__getContactByPhone: url == " + url);
	
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
    				console.log("sfdcservicecloud__getContactByPhone: ");
    				sfdcservicecloud__getAccountByPhone(json, sfdcservicecloud__buildAccountListForGetContactByAccountId); 
    			} else {
    				bg.setCallerName(results[0].Name);
    				console.log("sfdcservicecloud__getContactByPhone: xhr.status = " + xhr.status);
    				bg.setContactRole(results[0].Title);
    			    successCallBack(results, sfdcservicecloud__dispatchAccountForContactResults);
    			    bg.setCrmAuthStatus(true);
    			} 
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("sfdcservicecloud__getContactByPhone: xhr.responseText = " + xhr.responseText);
    			console.log("sfdcservicecloud__getContactByPhone: xhr.status = " + xhr.status); 
      		}
      	}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__getAccountNameById(accountId, rownum, results, callback) {
	console.log("sfdcservicecloud__getAccountNameById == " + results);
	console.log("sfdcservicecloud__getAccountNameById == " + accountId);
	console.log("sfdcservicecloud__getAccountNameById == " + rownum);
	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts?where=Id=\''+ accountId + '\'';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var resp = JSON.parse(xhr.responseText);
				
				console.log("sfdcservicecloud__getAccountNameById resp.Name == <" + resp[0].Name + ">");
				console.log("\n\n\n");
				var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].Name + '"}';
				callback(results, str, rownum, 1);
				//callback(resp, str, rownum, 1);
				bg.setCrmAuthStatus(true);
			} else { 
				bg.setCrmAuthStatus(false);
				console.log("sfdcservicecloud__getAccountNameById xhr.responseText = " + xhr.responseText);
				console.log("sfdcservicecloud__getAccountNameById xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// the First Contact Result Callback 
function sfdcservicecloud__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("sfdcservicecloud__getAccountForContactResults == " + JSON.stringify(results));
	console.log("sfdcservicecloud__getAccountForContactResults == " + acctCount);
	
	for ( var i = 0; i <= (results.length - 1) ;  i++) {
		console.log("Account ID == " + results[i].AccountId); 
		sfdcservicecloud__getAccountNameById(results[i].AccountId, i, results, sfdcservicecloud__dispatchAccountForContactResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function sfdcservicecloud__dispatchAccountForContactResults(results, acctdata, iteration, retcount) {

	console.log("sfdcservicecloud__dispatchAccountForContactResults == results " + results);
	console.log("sfdcservicecloud__dispatchAccountForContactResults == acctdata " + acctdata);
	console.log("sfdcservicecloud__dispatchAccountForContactResults == iteration " + iteration);
	console.log("sfdcservicecloud__dispatchAccountForContactResults == retcount " + retcount);
	
	acctCount += retcount; 
	console.log("sfdcservicecloud__dispatchAccountForContactResults == " + results);
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}
	
	console.log("sfdcservicecloud__dispatchAccountForContactResults == results " + results.length);
	console.log("sfdcservicecloud__dispatchAccountForContactResults == acctCount " + acctCount);
	console.log("sfdcservicecloud__dispatchAccountForContactResults == acctResult " + acctResult);
	
	if (acctCount == results.length) {
		//acctResult = '[' + acctResult + ']';
		console.log("sfdcservicecloud__dispatchAccountForContactResults == acctResult " + acctResult);
		sfdcservicecloud__dispatchIncidentByAccountId(JSON.parse('[' + acctResult + ']' ), sfdcservicecloud__getIncidentsByAccountId);
		sfdcservicecloud__handleCallResults('incident', results, JSON.parse('[' + acctResult + ']' ));
	}
		
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__handleCallResults(type, contacts, accounts) {

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
		var name = contacts[i].Name
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id; // id
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = accounts[i].accountName;
	
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
}
////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback 
function sfdcservicecloud__dispatchIncidentByAccountId(accounts, callback) {
	
	console.log("sfdcservicecloud__dispatchIncidentByAccountId accounts == " + JSON.stringify(accounts));
	console.log("sfdcservicecloud__dispatchIncidentByAccountId length == " + accounts.length + "\n\n");
	var uri;
	
	 if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("sfdcservicecloud__dispatchIncidentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = 'AccountId=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR AccountId=\'' +  accounts[i].accountId + '\'';
			}
		}
	} else if (accounts.length == 1){
		uri += 'AccountId=\''+  accounts[0].accountId + '\'';
		console.log("sfdcservicecloud__getIncedentByAccountId == only 1 " + uri);
	}
	
	console.log("sfdcservicecloud__dispatchIncidentByAccountId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
	
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__getIncidentsByAccountId(uri) {
	console.log("\n\n\nsfdcservicecloud__getIncidentsByAccountId == " + uri);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url += '/incidents?where=' + uri;
		url += ' and IsClosed=false';
	console.log("\n\n\nsfdcservicecloud__getIncidentsByAccountId == " + uri);
	var header = lc.getCloudElementsId();

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("sfdcservicecloud__getIncidentsByAccountId == " + xhr.status)
				console.log("sfdcservicecloud__getIncidentsByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
    			//console.log("sfdcservicecloud__getAccountById == " + acctId);
    			console.log("JSON == " + JSON.stringify(resp));
    			console.log("\n\n\n");
    			sfdcservicecloud__handleIncidentResults(resp);
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
function sfdcservicecloud__handleIncidentResults(incidents) {
	
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
		var status = incidents[i].Status;
		var casenumber = incidents[i].CaseNumber;
		var subject = incidents[i].Subject;
		var id = incidents[i].Id;
		incidentUrl = lc.getCrmBaseUrl() + '/' + id;
		
		contentJson.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '" class="contacts-table-name">' + casenumber + '</td>',
       		"cell_2"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">' + subject + '</td>',
       		"cell_3"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">'+ status + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    if (rowCount == 1) {
		
		//bg.setContentTableData(JSON.stringify(jsonString));
		console.log("sfdcservicecloud__handleIncidentResults: URL == " + incidentUrl);
		var new_window = window.open(incidentUrl, 'Case Number ' + casenumber);
		new_window.focus();
	} else  if (rowCount > 1) {
		console.log('sfdcservicecloud__handleIncidentResults: tblstr ' + contentJson);
		console.log('sfdcservicecloud__handleIncidentResults: tblstr ' + JSON.stringify(contentJson));
		//bg.setContentTableData(JSON.stringify(jsonString));
	}
	console.log("sfdcservicecloud__handleCallResults == " + contentJson);
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
} 
////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__getAccountByPhone(json, callback) {
	//var clid = callerId.substring(2);
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	
console.log("sfdcservicecloud__getAccountByPhone == " + json);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

console.log("HEADER == " + header);
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("sfdcservicecloud__getAccountByPhone == " + xhr.status)
				console.log("sfdcservicecloud__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, sfdcservicecloud__getContactByAccountId); //, str, rownum, 1);
				if (resp[0] !== undefined) {	
					bg.setCallerName(resp[0].Name);
					callback(resp, sfdcservicecloud__dispatchContactForAccountResults)
				} else {
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
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
function sfdcservicecloud__buildAccountListForGetContactByAccountId(accounts) {
console.log("\n\sfdcservicecloud__dispatchContactForAccountResults == " + JSON.stringify(accounts));	
	
	var jsonString;
	
	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		}
	}
	
	jsonString = '[' + jsonString + ']';
	console.log("\n\nsfdcservicecloud__dispatchContactForAccountResults == " + JSON.stringify(jsonString));	
	sfdcservicecloud__dispatchContactForAccountResults(JSON.parse(jsonString), sfdcservicecloud__getContactByAccountId)			
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdcservicecloud__dispatchContactForAccountResults(accountData, callback) {
	console.log("\n\nsfdcservicecloud__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("\n\nsfdcservicecloud__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=AccountId=\'';

	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("sfdcservicecloud__dispatchIncidentByAccountId == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';
	
			} else {
				url += encodeURIComponent(' OR AccountId=\'' +  accountData[i].accountId + '\'');
			}
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		console.log("sfdcservicecloud__getIncedentByAccountId == only 1 " + url);
	}
	console.log("sfdcservicecloud__getIncedentByAccountId ==  " + url);
	sfdcservicecloud__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function sfdcservicecloud__getContactByAccountId(accounts, url) { //, callback) {
	console.log("sfdcservicecloud__getContactByAccountId: == " + JSON.stringify(accounts));	
	
	var header = lc.getCloudElementsId();

	console.log("sfdcservicecloud__getContactByAccountId: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.log("sfdcservicecloud__getContactByAccountId: xhr.responseText == " + xhr.responseText);
				console.log("sfdcservicecloud__getContactByAccountId: results == " + JSON.stringify(results));
				console.log("sfdcservicecloud__getContactByAccountId: results.length == " + results.length);
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				console.log("sfdcservicecloud__getContactByAccountId: ");
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    			  	sfdcservicecloud__dispatchIncidentByAccountId(accounts, sfdcservicecloud__getIncidentsByAccountId);
    				sfdcservicecloud__handleContactsByAccountById('incident', results, accounts);//, sfdcservicecloud__dispatchContactForAccountResults)
    			    bg.setCrmAuthStatus(true);
    			} 
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
function sfdcservicecloud__handleContactsByAccountById(type, contacts, accounts) {
	console.log("sfdcservicecloud__handleContactsByAccountById: type == " + type);
	console.log("sfdcservicecloud__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	var dict = {}
	accounts.forEach(function(accounts) {
		dict[accounts.accountId] = accounts.accountName
	});
	
	var rowCount = contacts.length;
	var jsonString = {};
	jsonString.dataRows = new Array();
	
	if (rowCount) {
    	jsonString.dataRows.push({
    		"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
        	"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
       		"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
       		"rowend"   : 	'</tr>'
	    });
	}
	
	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		var name = contacts[i].Name
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = dict[contacts[i].AccountId];

		jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="incident"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    
    if (rowCount == 1) {
		
		//bg.setAnchorTableData(JSON.stringify(jsonString));
		
		bg.setContactLeadId(json[i].id); 
		var new_window = window.open(url, 'Contact ' + name);
		new_window.focus();
		
	} else  if (rowCount > 1) {
		console.log('sfdcservicecloud__handleContactsByAccountById: tblstr ' + jsonString);
		console.log('sfdcservicecloud__handleContactsByAccountById: tblstr ' + JSON.stringify(jsonString));
		
		
	}
	bg.setAnchorTableData(JSON.stringify(jsonString));
} 
