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

var nameDict = {};
///////////////////////////////////////////////////////////////
exports.zoho__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);
	
	console.log("zoho__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("zoho__callHandler: "+ callState +" RINGBACK == " + json.ringback);
	
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		zoho__getContactByPhone(json, zoho__getAccountForContactResults);
				
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if ((callState == 'CALL_END') && (json.ringback !== 'true')) {
	
		console.log("zoho__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};


////////////////////////////////////////////////////////////////////////////////////////
function zoho__getContactByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/contacts?where=(Phone=\'' + internationalNumber + '\' or Phone=\'' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	console.log("zoho__getContactByPhoneDataCall: url == " + url); 

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
					console.log("zoho__getLeadByPhone: ");
					zoho__getContactByMobile(json, callback);
				} else {
					console.log("Name: " + results[0]['Contact Owner'] + " | Tile: " + results[0].Title);

					bg.setCallerName(results[0]['Contact Owner']);
					bg.setContactRole(results[0].Title);
					zoho__getAccountForContactResults(results, zoho__dispatchAccountForContactResults);

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
function zoho__getContactByMobile(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/contacts?where=(Mobile=\'' + internationalNumber + '\' or Mobile=\'' +  internationalRawNumber + '\' or Mobile=\'' +  nationalNumber + '\' or Mobile=\'' +  nationalRawNumber + '\')';

	console.log("zoho__getContactByMobile: url == " + url);

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
					console.log("zoho__getLeadByPhone: ");
					zoho__getLeadByPhone(json);
				} else {
					console.log("Name: " + results[0]['Contact Owner'] + " | Tile: " + results[0].Title);

					bg.setCallerName(results[0]['Contact Owner']);
					bg.setContactRole(results[0].Title);
					callback(results, zoho__dispatchAccountForContactResults);
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
//callback zoho__getLeadByPhone
function zoho__getLeadByPhone(json, callback) {
	var callerId = bg.getRawCallId();
	//var clid = callerId.substring(2);
	//var fmtCallId = bg.getFormattedCallID();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	//url +='/leads?where=(Phone=\'' + clid + '\')';
	url +='/leads?where=(Phone=\'' + internationalNumber + '\' or Phone=\'' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	console.log("zoho__getLeadByPhone: url == " + url);

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
					console.log("zoho__getAccountByPhone: ");
					zoho__getAccountByPhone(json, zoho__buildAccountListForGetContactByAccountId);
				} else {
					bg.setCallerName(results[0]['First Name'] + results[0]['Last Name']);
					bg.setCrmAuthStatus(true);
					console.log("Lead found!!")
					zoho__handleLeadCallResults(results);
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
//callback zoho__getAccountByPhone
function zoho__getAccountByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	//var clid = callerId.substring(2);
	//var fmtCallId = bg.getFormattedCallID();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/accounts?where=(Phone=\'' + internationalNumber + '\' or Phone=\'' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	console.log("zoho__getAccountByPhone: url == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("zoho__getAccountByPhone == " + xhr.status)
				console.log("zoho__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, zoho__getContactByAccountId); //, str, rownum, 1);
				if (resp[0] !== undefined) {
					callback(resp, zoho__dispatchContactForAccountResults)
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
function zoho__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("zoho__getAccountForContactResults == " + results);
	console.log("zoho__getAccountForContactResults == " + acctCount);

	for ( var i = 0; i <= (results.length - 1);  i++) {
		console.log("zoho__getAccountForContactResults:: AccountId: " + results[i].ACCOUNTID);
		zoho__getAccountNameById(results[i].ACCOUNTID, i, results, zoho__dispatchAccountForContactResults);
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__getAccountNameById(accountId, rownum, results, callback) {
	console.log("zoho__getAccountNameById == " + results.length);
	console.log("zoho__getAccountNameById == " + accountId);
	console.log("zoho__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts/'+ accountId;

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var resp = JSON.parse(xhr.responseText);
				console.log("\n\n\n");
				var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp['Account Name'] + '"}';
				//callback(resp, str, rownum, 1);
				callback(results, str, rownum, 1);
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
function zoho__buildAccountListForGetContactByAccountId(accounts) {
	console.log("\nzoho__buildAccountListForGetContactByAccountId == " + JSON.stringify(accounts));

	var jsonString;

	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].ACCOUNTID + '", "accountName": "' + accounts[i]['Account Name'] + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].ACCOUNTID + '", "accountName": "' + accounts[i]['Account Name'] + '"}';
		}
	}

	jsonString = '[' + jsonString + ']';
	console.log("\n\nzoho__buildAccountListForGetContactByAccountId == " + JSON.stringify(jsonString));
	zoho__dispatchContactForAccountResults(JSON.parse(jsonString))
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__dispatchContactForAccountResults(accountData, callback) {
	console.log("\n\zoho__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("\n\zoho__dispatchContactForAccountResults == length " + accountData.length);

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/contacts?where=\'Account Name\'=\'';

// Lets' make sure we don't have duplicate account ID.
	if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("zoho__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountName + '\'';

			} else {
				url += encodeURIComponent(' OR \'Account Name\'=\'' +  accountData[i].accountName + '\'');
			}
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountName + '\'';
		console.log("zoho__dispatchContactForAccountResults == only 1 " + url);
	}
	console.log("zoho__dispatchContactForAccountResults ==  " + url);

	zoho__getContactByAccountName(accountData, url)
}

////////////////////////////////////////////////////////////////////////////////////////
//callback
function zoho__getContactByAccountName(accounts, url) { //, callback) {
	console.log("zoho__getContactByAccountName: == " + JSON.stringify(accounts));

	var header = lc.getCloudElementsId();

	console.log("zoho__getContactByAccountName: url == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var results = JSON.parse( xhr.responseText );
				console.log("zoho__getContactByAccountName: results.length == " + results.length);
				// What if there are no results  look at accounts.
				if (results.length <= 0) {
					console.log("zoho__getContactByAccountName: ");

					bg.setCrmAuthStatus(true);
				} else {
					//zoho__dispatchContentByAccountId(accounts, zoho__getContentByAccountId);

					if (lc.getContentPrimary() == 'activities') {
						zoho__dispatchContentByContactId(results, zoho__getContentByContactId); // Activities
					} else if (lc.getContentPrimary() == 'opportunities') {
						zoho__dispatchContentByAccountId(accounts, zoho__getContentByAccountId); // Activities
					}
					zoho__handleContactsByAccountById('any', results, accounts);//, zoho__dispatchContactForAccountResults)
					bg.setCrmAuthStatus(true);
					return true;
				}
			} else if ( xhr.status == 401 ){
				bg.setCrmAuthStatus(false);
				console.log("UN authorized");
				alert("CRM Unauthorized Access");
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
				return false;
			} else {
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
				return false;
			}
		}

	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function zoho__dispatchAccountForContactResults(results, acctdata, iteration, retcount) {
	acctCount += retcount;
	console.log("zoho__dispatchAccountForContactResults == " + acctCount);
	console.log("zoho__dispatchAccountForContactResults == " + results);
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}

	if (acctCount == results.length) {
		//acctResult = '[' + acctResult + ']';

		if (lc.getContentPrimary() == 'activities') {
			zoho__dispatchContentByContactId(results, zoho__getContentByContactId); // Activities
		} else if (lc.getContentPrimary() == 'opportunities') {
			zoho__dispatchContentByAccountId(JSON.parse('[' + acctResult + ']'), zoho__getContentByAccountId); // Activities
		}

		zoho__handleCallResults('incident', results, JSON.parse('[' + acctResult + ']'));
	}
}

////////////////////////////////////////////////////////////////////////////////////////
// function zoho__dispatchActivitiesByContactResults(results) {
// 	acctCount += retcount;
// 	console.log("zoho__dispatchAccountForContactResults == " + acctCount);
// 	console.log("zoho__dispatchAccountForContactResults == " + results);
// 	if (acctCount == 1) {
// 		acctResult = acctdata;
// 	} else if (acctCount > 1)  {
// 		acctResult += ',' + acctdata;
// 	}
//
// 	if (acctCount == results.length) {
// 		//acctResult = '[' + acctResult + ']';
//
// 		zoho__dispatchContentByAccountId(JSON.parse('[' + acctResult + ']'), zoho__getContentByAccountId); // Activities
// 		zoho__handleCallResults('incident', results, JSON.parse('[' + acctResult + ']'));
// 	}
// }

////////////////////////////////////////////////////////////////////////////////////////
function zoho__handleCallResults(type, contacts, accounts) {
	console.log("zoho__handleCallResults == " + type);
	acctCount = 0;
	var rowCount = contacts.length;
	var anchorHead = {};
	var anchorString = {};
	anchorHead.dataRows = new Array();
	anchorString.dataRows = new Array();

	if (contacts.length) {
		anchorHead.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + (contacts.length + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
			"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
			"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
			"rowend"   : 	'</tr>'
		});
	}

	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		console.log("Contact: " + JSON.stringify(contacts[i]))
		var name = contacts[i]['Contact Owner'];
		var acctId = contacts[i].ACCOUNTID;
		var id = contacts[i].CONTACTID;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = accounts[i].accountName;
		nameDict[id] = name;
		anchorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
			"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
			"rowend"   : 	'</tr>'
		});
	}
	bg.setAnchorTheadData(JSON.stringify(anchorHead));
	bg.setAnchorTableData(JSON.stringify(anchorString));
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__handleLeadCallResults(leads) {
	var anchorHead = {};
	var anchorString = {};
	anchorHead.dataRows = new Array();
	anchorString.dataRows = new Array();

	if (leads.length) {
		anchorHead.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + (leads.length + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
			"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Create</td>',
			"rowend"   : 	'</tr>'
		});
	}

	for ( var i = 0; i <= (leads.length - 1);  i++) {
		console.log("Contact: " + JSON.stringify(leads[i]))
		var name = leads[0]['First Name'] + leads[0]['Last Name'];
		var id = leads[i].LEADID;
		nameDict[id] = name;
		anchorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="lead">' + bg.getCreateNewString() + '</td>',
			"rowend"   : 	'</tr>'
		});
	}
	bg.setAnchorTheadData(JSON.stringify(anchorHead));
	bg.setAnchorTableData(JSON.stringify(anchorString));
}

////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback
function zoho__dispatchContentByAccountId(accounts, callback) {

	console.log("\n\zoho__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.log("zoho__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;

	if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("zoho__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = '\'Account Name\'=\''+ accounts[i].accountName + '\'';
			} else {
				uri += ' OR \'Account Name\'=\'' +  accounts[i].accountName + '\'';
			}
		}
	} else if (accounts.length == 1){
		uri = '\'Account Name\'=\''+  accounts[0].accountName + '\'';
		console.log("zoho__dispatchContentByAccountId == only 1 " + uri);
	}

	console.log("zoho__dispatchContentByAccountId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
}

function zoho__dispatchContentByContactId(contacts, callback) {

	console.log("\n\zzoho__dispatchContentByContactId == " + JSON.stringify(contacts));
	console.log("zoho__dispatchContentByContactId == " + contacts.length + "\n\n");
	var uri;

	if (contacts.length > 1) {
		for ( var i = 0; i <= (contacts.length - 1);  i++) {
			if (i == 0) {
				uri = '\'Call Owner\'=\''+ contacts[i]['Contact Owner'] + '\'';
			} else {
				uri += ' OR \'Call Owner\'=\'' +  contacts[i]['Contact Owner'] + '\'';
			}
		}
	} else if (contacts.length == 1){
		uri = '\'Call Owner\'=\''+  contacts[0]['Contact Owner'] + '\'';
		console.log("zoho__dispatchContentByContactId == only 1 " + uri);
	}

	console.log("zoho__dispatchContentByContactId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__handleContactsByAccountById(type, contacts, accounts) {
	console.log("zoho__handleContactsByAccountById: type == " + type);
	console.log("zoho__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	acctdict = {}
	accounts.forEach(function(accounts) {
		acctdict[accounts.accountId] = accounts.accountName
	});

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
		var name = contacts[i]['Contact Owner'];
		nameDict[contacts[i].Id] = name;
		var acctId = contacts[i].ACCOUNTID; 
		var id = contacts[i].CONTACTID;
		var acctname = acctdict[acctId];

		achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
			"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
			"rowend"   : 	'</tr>'
		});
	}

	bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__getContentByAccountId(uri) {
	console.log("\n" +lc.getContentPrimary() + "\nzoho__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url += '/opportunities?where=' + uri;

	console.log("\n" + lc.getContentPrimary() + "\nzoho__getContentByAccountId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\nzoho__getContentByAccountId == " + url);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("zoho__getContentByAccountId == " + xhr.status)
				//console.log("zoho__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("zoho__getAccountById == " + acctId);
				console.log("zoho__getContentByAccountId == " + JSON.stringify(resp, null, 2));

				if (lc.getContentPrimary() == 'activities') {
					zoho__dispatchNameForActivity(resp, zoho__handleContentResults);
				} else {
					zoho__handleContentResults(resp);
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
function zoho__getContentByContactId(uri) {
	console.log("\n" +lc.getContentPrimary() + "\nzoho__getContentByContactId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url += '/activities-calls?where=' + uri;


	console.log("\n" + lc.getContentPrimary() + "\nzoho__getContentByContactId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\nzoho__getContentByContactId == " + url);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("zoho__getContentByAccountId == " + xhr.status)
				//console.log("zoho__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("zoho__getAccountById == " + acctId);
				console.log("zoho__getContentByContactId == " + JSON.stringify(resp, null, 2));

				//if (lc.getContentPrimary() == 'activities') {
				//	zoho__dispatchNameForActivity(resp, zoho__handleContentResults);
				//} else {
					zoho__handleContentResults(resp);
				//}
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
function zoho__dispatchNameForActivity(content, zoho__handleContentResults) {
	var uri;

	console.log('sfdc__dispatchNameForActivity results = ' + content.length);
	for ( var i = 0; i <= (content.length - 1 );  i++) {
		console.log('sfdc__dispatchNameForActivity == ' + i + " " + content[i]);
		if (i == 0) {
			uri = 'Id=\''+ content[i].CONTACTID + '\'';
		} else {
			uri += ' OR Id=\'' +  content[i].CONTACTID + '\'';
		}
	}
	console.log('sfdc__dispatchNameForActivity url = ' + uri)
	if (content.length > 0)
		zoho__getContactByIds(uri, content, zoho__handleContentResults);
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__getContactByIds(uri, content, zoho__handleContentResults) {
	var url = sfdcceUrl +  '/' + lc.getRoutePath();
	url +='/contacts?where=' + uri;
	var header = lc.getCloudElementsId();

	if (sfdcwfdebug == 1) { console.log("sfdc__getContactByPhoneDataCall: url == " + url); }

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
					console.log("sfdc__getContactByIds: ");
				} else {
					console.log("sfdc__getContactByIds: " + JSON.stringify(results, null, 2));
					zoho__buildNameDict(results, content, zoho__handleContentResults)
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
function zoho__buildNameDict(results, content, zoho__handleContentResults ) {
	console.log('sfdc__buildNameDict results = ' + results.length);
	for ( var i = 0; i <= (results.length - 1 );  i++) {
		nameDict[results[i].Id] = results[i].Name;
	}
	console.log('sfdc__buildNameDict url = ' + JSON.stringify(nameDict, null, 2));
	zoho__handleContentResults(content);
}

////////////////////////////////////////////////////////////////////////////////////////
function zoho__handleContentResults(content) {

	var contentUrl;
	var rowCount = content.length;
	console.log("zoho__handleContentResults: rowCount == " + rowCount);
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	
	console.log('zoho__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));
	if (rowCount) {
		if (lc.getContentPrimary() == 'activities') {
			theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Type</th>',
				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Contact</th>',
				"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Subject</th>',
				"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Due Date</th>',
				"rowend"   : 	'</tr>'
			});
		} else if (lc.getContentPrimary() == 'opportunities') {
			theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Stage</th>',
				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Name</th>',
				"cell_3"   : 	'<th id="content-head-3" class="contacts-table">MRR</th>',
				"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Close Date</th>',
				"rowend"   : 	'</tr>'
			});
		}
	}

	for ( var i = 0; i <= (content.length - 1);  i++) {
		if (lc.getContentPrimary() == 'activities') {

			var subtype = content[i].EventSubtype;
			var id = content[i].Id;
			var status = content[i].Status;
			var date = content[i].EndDateTime;
			console.log("zoho__handleContentResults: WhoId == " + content[i].WhoId);
			var col1 = content[i].Type || 'Not Defined';    			// Type			//
			var col2 = nameDict[content[i].WhoId];						// Name ,-- Get the contact names
			var col3 = content[i].Subject;								// Subject
			var col4 = date.slice(1, 10); 								//Date

		} else if (lc.getContentPrimary() == 'opportunities') {
			var col1 = content[i].Stage || 'Not Defined';  			//Stage
			var col2 = content[i]['Potential Name'];				//Name
			var col3 = content[i].Amount || 'Not Defined';		//MRR
			var col4 = content[i]['Closing Date'];							//Close Date
			var id = content[i].POTENTIALID;
		}

		if (i >= 0) {
			contentJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col1 + '</td>',
				"cell_2"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col2 + '</td>',
				"cell_3"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col3 + '</td>',
				"cell_4"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col4 + '</td>',
				"rowend"   : 	'</tr>'
			});
		}

	}
	
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
}
