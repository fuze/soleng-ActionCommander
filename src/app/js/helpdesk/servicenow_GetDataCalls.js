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
exports.servicenow__callHandler = function(callState, json) {
	console.debug("servicenow__callHandler: == callState " + callState);
	console.debug("servicenow__callHandler: == _callHandled " + _callHandled);
	bg.setCallDirection(json.direction);
	util.setCallData(callState, json);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		console.debug("servicenow__callHandler: Call State == " + callState);
		util.setCallData(callState, json);
		console.debug("servicenow__callHandler: json == " + JSON.stringify(json));
		//servicenow__getContactByPhoneFormat(json, phoneNumberPattern.International);
		servicenow__getContactByPhoneDispatcher(json, 0, servicenow__getContactByMobileDispatcher, servicenow__getAccountForContactResults);
	} else if (callState == 'CONNECT') {
		
		bg.setStarttime('mdy');
		util.setCallData(callState, json);

	} else if ((callState == 'CALL_END')  && (json.ringback !== 'true')) {
		_callHandled = false;
		
		console.debug("servicenow__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
	}

};

////////////////////////////////////////////////////////////////////////////////////////
// servicenow__getContactByPhoneMobileDispatcher
// Find the Contact(s)  given phone number
//
// @parm json 				== Call Data JSON Packet;
// @iteration 				== current iteration of the dispatcher
// @parm failCallBack		== this until all # are exhausted then servicenow__getContactByMobileDispatcher
// @parm successCallBack 	== servicenow__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
//function servicenow__getContactByPhoneORMobileDispatcher(json, iteration, failCallBack, successCallBack) {
function servicenow__getContactByPhoneDispatcher(json, iteration, failCallBack, successCallBack) {
	var callerId = bg.getRawCallId();
	
	var numbers = [];
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalPlus));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRawPlus));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw));
	
	for (var i = iteration; i < numbers.length; i++) {
		var url = cloudElementsUrl +  '/' + lc.getRoutePath();
			url +='/contacts?where=phone=\'' + numbers[i] + '\'';
		console.log('servicenow__getContactByPhoneDispatcher: iteration # ' + i + ' max = ' + numbers.length);
		servicenow__getContactByPhone(json, i, url, numbers.length, failCallBack, successCallBack); 
	}
}

////////////////////////////////////////////////////////////////////////////////////////
// servicenow__getContactByPhone
// Find the Contact(s)  given phone number
//
// @parm json 				== Call Data JSON Packet;
// @parm failCallBack 		== servicenow__getContactByMobile
// @parm successCallBack 	== servicenow__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getContactByPhone(json, iteration, url, max, failCallBack, successCallBack) {
	
	var header = lc.getCloudElementsId();

	console.log("servicenow__getContactByPhone: url == " + url + "iteration == " + iteration);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.log("servicenow__getContactByPhone: responseText " + JSON.stringify(xhr.responseText));
    			if (results.length <= 0) {
    				console.log("servicenow__getContactByPhone: iteration " + iteration);
    				if (iteration < max) { 
						servicenow__getContactByPhoneDispatcher(json, iteration + 1, failCallBack, successCallBack);
					} else {
    					servicenow__getContactByMobileDispatcher(json, 0, failCallBack, successCallBack);
    				} //servicenow__getContactByMobile(json);
    				
    			} else {
    				console.log("servicenow__getContactByPhone: results " + JSON.stringify(results, null, 2));
    				bg.setCallerName(results[0].name);
    				var vip = results[0].vip;
    				bg.setContactRole('VIP: ' + vip.toUpperCase());
    				servicenow__getAccountForContactResults(results, servicenow__dispatchAccountForContactResults);

    			} 
      		} else { 
      
      			console.warn("servicenow__getContactByPhone: xhr.responseText = " + xhr.responseText);
    			console.warn("servicenow__getContactByPhone: xhr.status = " + xhr.status); 
      		}
      	}  
  		
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
// servicenow__getContactByPhoneDispatcher
// Find the Contact(s)  given phone number
//
// @parm json 				== Call Data JSON Packet;
// @iteration 				== current iteration of the dispatcher
// @parm failCallBack		== this until all # are exhausted then servicenow__getContactByMobileDispatcher
// @parm successCallBack 	== servicenow__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getContactByMobileDispatcher(json, iteration, failCallBack, successCallBack) {
	var callerId = bg.getRawCallId();
	
	var numbers = [];
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw));
	
	
	for (var i = iteration; i < numbers.length; i++) {
		var url = cloudElementsUrl +  '/' + lc.getRoutePath();
			url +='/contacts?where=phone%3D\'' + numbers[i] + '\'';
		console.log('servicenow__getContactByMobileDispatcher: iteration # ' + i + ' max = ' + numbers.length);
		servicenow__getContactByPhone(json, i + 1, url, numbers.length, failCallBack, successCallBack) 
	}
}
////////////////////////////////////////////////////////////////////////////////////////
// servicenow__getContactByMobile
// Finds the Company Name for a given phone number
//
// @parm json 				== Call Data JSON Packet;
// @parm failCallBack 		== servicenow__getAccountByPhone
// @parm successCallBack 	== servicenow__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getContactByMobile(json) {
	
	var header = lc.getCloudElementsId();

	console.log("servicenow__getContactByMobile: url == " + url + "iteration == " + iteration);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.log("servicenow__getContactByMobile: responseText " + JSON.stringify(xhr.responseText));
    			if (results.length <= 0) {
    				console.log("servicenow__getContactByMobile: iteration " + iteration);
    				if (iteration < max) { 
						servicenow__getContactByMobileDispatcher(json, iteration + 1, failCallBack, successCallBack);
					} else {
    					servicenow__getAccountByPhoneFormat(json, 0, servicenow__getAccountByPhoneFormat, null);
    				} 
    				
    			} else {
    				console.log("servicenow__getContactByMobile: results " + JSON.stringify(results, null, 2));
    				bg.setCallerName(results[0].name);
    				var vip = results[0].vip;
    				bg.setContactRole('VIP: ' + vip.toUpperCase());
    				servicenow__getAccountForContactResults(results, servicenow__dispatchAccountForContactResults);

    			} 
      		} else { 
      
      			console.log("servicenow__getContactByMobile: xhr.responseText = " + xhr.responseText);
    			console.log("servicenow__getContactByPhone: xhr.status = " + xhr.status); 
      		}
      	}  
  		
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// servicenow__getAccountPhoneDispatcher
// Find the Contact(s)  given phone number
//
// @parm json 				== Call Data JSON Packet;
// @iteration 				== current iteration of the dispatcher
// @parm failCallBack		== this until all # are exhausted then servicenow__getContactByMobileDispatcher
// @parm successCallBack 	== servicenow__getAccountForContactResults
//
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getAccountPhoneDispatcher(json, iteration, failCallBack, successCallBack) {
	var callerId = bg.getRawCallId();
	
	var numbers = [];
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National));
	numbers.push(ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw));
	
	
	for (var i = iteration; i < numbers.length; i++) {
		var url = cloudElementsUrl +  '/' + lc.getRoutePath();
			url +='/accounts?where=phone%3D\'' + numbers[i] + '\'';
		console.log('servicenow__getContactByMobileDispatcher: iteration # ' + i + ' max = ' + numbers.length);
		servicenow__getAccountByPhone(json, i + 1, url, numbers.length, failCallBack, successCallBack) 
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getAccountByPhone(json, iteration, url, max, failCallBack, successCallBack) {

	var header = lc.getCloudElementsId();

	console.log("servicenow__getContactByMobile: url == " + url + "iteration == " + iteration);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.log("servicenow__getContactByMobile: responseText " + JSON.stringify(xhr.responseText));
    			if (results.length <= 0) {
    				console.log("servicenow__getContactByMobile: iteration " + iteration);
    				if (iteration < max) { 
						servicenow__getAccountPhoneDispatcher(json, iteration + 1, failCallBack, successCallBack);
					} else {
    					//servicenow__getAccountByPhoneFormat(json, 0, servicenow__getAccountByPhoneFormat, null);
    				} 
    				
    			} else {
    				console.log("servicenow__getContactByMobile: results " + JSON.stringify(results, null, 2));
    				bg.setCallerName(results[0].name);
    				var vip = results[0].vip;
    				bg.setContactRole('VIP: ' + vip.toUpperCase());
    				servicenow__getAccountForContactResults(results, servicenow__dispatchAccountForContactResults);

    			} 
      		} else { 
      
      			console.log("servicenow__getContactByMobile: xhr.responseText = " + xhr.responseText);
    			console.log("servicenow__getContactByPhone: xhr.status = " + xhr.status); 
      		}
      	}  
  		
	}
	xhr.send(null);
}


////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getAccountNameById(accountId, rownum, results, callback) {
	//console.log("servicenow__getAccountNameById == " + results);
	//console.log("servicenow__getAccountNameById == " + accountId);
	//console.log("servicenow__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts?where=sys_id=\''+ accountId + '\'';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
			
				var resp = JSON.parse(xhr.responseText);
				var str = '';
				//console.log("servicenow__getAccountNameById resp = " + JSON.stringify(resp, null, 2));
				//console.log("servicenow__getAccountNameById LENGTH = " + resp.length);
				if ( resp.length > 0 ) {
					console.log("servicenow__getAccountNameById resp.name == <" + resp[0].name + ">");
					str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].name + '"}';
				} else {
					str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": ""}';
				}
				callback(results, str, rownum, 1);

				bg.setCrmAuthStatus(true);
			} else { 
				bg.setCrmAuthStatus(false);
				console.log("servicenow__getAccountNameById xhr.responseText = " + xhr.responseText);
				console.log("servicenow__getAccountNameById xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// the First Contact Result Callback 
function servicenow__getAccountForContactResults(contacts, callback) {
	var acctCount = contacts.length;
	//console.log("servicenow__getAccountForContactResults == " + JSON.stringify(contacts, null, 2));
	//console.log("servicenow__getAccountForContactResults == " + acctCount);
	
	for ( var i = 0; i <= (contacts.length - 1) ;  i++) {
		//console.log("servicenow__getAccountForContactResults Account ID == " + contacts[i].company.value);
		servicenow__getAccountNameById(contacts[i].company.value, i, contacts, servicenow__dispatchAccountForContactResults);
	}

}
////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function servicenow__dispatchAccountForContactResults(contacts, acctdata, iteration, retcount) {

	console.log("servicenow__dispatchAccountForContactResults == results " + JSON.stringify(contacts));
	console.log("servicenow__dispatchAccountForContactResults == acctdata " + acctdata);
	console.log("servicenow__dispatchAccountForContactResults == iteration " + iteration);
	console.log("servicenow__dispatchAccountForContactResults == retcount " + retcount);
	
	acctCount += retcount; 
	console.log("servicenow__dispatchAccountForContactResults == " + contacts);
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}
	
	console.log("servicenow__dispatchAccountForContactResults == results " + contacts.length);
	console.log("servicenow__dispatchAccountForContactResults == acctCount " + acctCount);
	console.log("servicenow__dispatchAccountForContactResults == acctResult " + acctResult);
	
	if (acctCount == contacts.length) {
		//acctResult = '[' + acctResult + ']';
		//console.log("servicenow__dispatchAccountForContactResults == acctResult " + acctResult);
		servicenow__dispatchIncidentByAccountId(JSON.parse('[' + acctResult + ']' ), servicenow__getIncidentsByAccountId);
		servicenow__handleCallResults('incident', contacts, JSON.parse('[' + acctResult + ']' ));
	}
		
}
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__handleCallResults(type, contacts, accounts) {
	acctCount = 0;
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
		var acctId = contacts[i].company.value;
		//var acctId = contacts[i].accountId;
		var id = contacts[i].sys_id; // id
		console.log("UserConnectorAcct == " + id + " Name " + name);
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = accounts[i].accountName;
	
    	 achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="incident"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    console.log("servicenow__handleCallResults == setAnchorTheadData " + JSON.stringify(achorString));
    console.log("servicenow__handleCallResults == setAnchorTableData " + JSON.stringify(anchorHead));
    bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}
////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback 
function servicenow__dispatchIncidentByAccountId(accounts, callback) {
	
	//console.log("servicenow__dispatchIncidentByAccountId accounts == " + JSON.stringify(accounts));
	//console.log("servicenow__dispatchIncidentByAccountId length == " + accounts.length + "\n\n");
	var uri;
	
	 if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			//console.log("servicenow__dispatchIncidentByAccountId == in for loop company " + accounts.length);
			//console.log("servicenow__dispatchIncidentByAccountId == in for loop company " +accounts[i].accountId);
			if (i == 0) {
				uri = 'company=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR company=\'' +  accounts[i].accountId + '\'';
			}
		}
	} else if (accounts.length == 1){
		//console.log("servicenow__dispatchIncidentByAccountId == in for loop company " +accounts[i].accountId);
		uri += 'company=\''+  accounts[0].accountId + '\'';
		//console.log("servicenow__getIncedentByAccountId == only 1 " + uri);
	}
	
	//console.log("servicenow__dispatchIncidentByAccountId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
	
}
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__getIncidentsByAccountId(uri) {
	//console.log("\n\n\nservicenow__getIncidentsByAccountId == " + uri);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url += '/incidents?where=active=true and' + uri;
	//console.log("\n\n\nservicenow__getIncidentsByAccountId == " + uri);
	var header = lc.getCloudElementsId();
	
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				
				var resp = JSON.parse(xhr.responseText);
    			
    			servicenow__handleIncidentResults(resp);
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
function servicenow__handleIncidentResults(incidents) {
	
	var incidentUrl;
	var rowCount = incidents.length;
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	
	if (rowCount) {
    	theadJson.dataRows.push({
    		"rowstart" : 	'<tr id="remove-' + (rowCount + 1)  + '">',
			"cell_1"   : 	'<th id="content-head-1" class="activities-table">Incident</th>',
       		"cell_2"   : 	'<th id="content-head-4" class="activities-table">Description</th>',
       		"cell_3"   : 	'<th id="content-head-2" class="activities-table">Status</th>',
       		"rowend"   : 	'</tr>'
	    });
	}
	
	for ( var i = 0; i <= (incidents.length - 1);  i++) {
		var status = incidents[i].state;
		var casenumber = incidents[i].number;
		var subject = incidents[i].short_description;
		var id = incidents[i].sys_id;
		var start;
		var end;
		incidentUrl = lc.getCrmBaseUrl() + '/nav_to.do?uri=incident.do?sys_id=' + id;
	
		
		contentJson.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '" class="activities-table-name">' + casenumber + '</td>',
       		"cell_2"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">' + subject + '</td>',
       		"cell_3"   : 	'<td action="openwindow" type="incident" ticketid="'+ id + '">'+ status + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    if (rowCount == 1) {
		
		//console.log("servicenow__handleIncidentResults: URL == " + incidentUrl);
		var new_window = window.open(incidentUrl, 'Case Number ' + casenumber);
		new_window.focus();
	} else  if (rowCount > 1) {
		console.log('servicenow__handleIncidentResults: tblstr ' + contentJson);
		console.log('servicenow__handleIncidentResults: tblstr ' + JSON.stringify(contentJson));

	}
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
} 

////////////////////////////////////////////////////////////////////////////////////////
function servicenow__buildAccountListForGetContactByAccountId(accounts) {
//console.log("\n\servicenow__buildAccountListForGetContactByAccountId == " + JSON.stringify(accounts, null, 2));	
	
	var jsonString;
	
	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].sys_id + '", "accountName": "' + accounts[i].name + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].sys_id + '", "accountName": "' + accounts[i].name + '"}';
		}
	}
	
	jsonString = '[' + jsonString + ']';
	//console.log("\n\nservicenow__buildAccountListForGetContactByAccountId == " + JSON.stringify(jsonString));	
	servicenow__dispatchContactForAccountResults(JSON.parse(jsonString), servicenow__getContactByAccountId)			
}
////////////////////////////////////////////////////////////////////////////////////////
function servicenow__dispatchContactForAccountResults(accountData, callback) {
	//console.log("\n\nservicenow__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	//console.log("\n\nservicenow__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=company=\'';

	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			//console.log("nservicenow__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';
	
			} else {
				url += encodeURIComponent(' OR company=\'' +  accountData[i].accountId + '\'');
			}
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		//console.log("nservicenow__dispatchContactForAccountResults == only 1 " + url);
	}
	//console.log("nservicenow__dispatchContactForAccountResults ==  " + url);
	servicenow__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function servicenow__getContactByAccountId(accounts, url) { 
	//console.log("servicenow__getContactByAccountId: == " + JSON.stringify(accounts));	
	
	var header = lc.getCloudElementsId();

	console.log("servicenow__getContactByAccountId: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				//console.log("servicenow__getContactByAccountId: ");
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    			  	servicenow__dispatchIncidentByAccountId(accounts, servicenow__getIncidentsByAccountId);
    			  	//servicenow__handleCallResults('incident', results, accounts);
    				servicenow__handleContactsByAccountById('incident', results, accounts);//, servicenow__dispatchContactForAccountResults)
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
function servicenow__handleContactsByAccountById(type, contacts, accounts) {
	//console.log("servicenow__handleContactsByAccountById: type == " + type);
	//console.log("servicenow__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	
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
		var name = contacts[i].name
		var acctId = contacts[i].sys_id;
		var id = contacts[i].sys_id;
console.log("UserConnectorAcct == " + id + " Name " + name);
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = accounts[0].accountName;

		jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="incident"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    
    if (rowCount == 1) {
		
		bg.setContactLeadId(json[i].id); 
		var new_window = window.open(url, 'Contact ' + name);
		new_window.focus();
		
	} else  if (rowCount > 1) {
		console.log('servicenow__handleContactsByAccountById: tblstr ' + jsonString);
		console.log('servicenow__handleContactsByAccountById: tblstr ' + JSON.stringify(jsonString));
	}
	bg.setAnchorTableData(JSON.stringify(jsonString));
} 
