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
exports.msdynamics__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);

	console.log("msdynamics__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("msdynamics__callHandler: "+ callState +" Caller ID == " + json.direction);

	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		util.setCallData(callState, json);
		msdynamics__getContactByPhone(json, msdynamics__getAccountForContactResults);

	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("msdynamics__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};

///////////////////////////////////////////////////////////////
function msdynamics__Validate(callback) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/ping';
	var header = lc.getCloudElementsId();
	console.log("msdynamics__Validate: " + url);
	console.log("msdynamics__Validate: " + header);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization",  header );
    xhr.setRequestHeader("cache-control", "no-cache");
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) {
    			console.log("msdynamics__Validate: resp.success == " + xhr.responseText)
    			var resp = JSON.parse( xhr.responseText );
    			if ( typeof resp.endpoint == 'string' ) {
    				console.log("msdynamics__Validate: User Validated ");
    				bg.setCrmAuthStatus(true);
    			}
      		} else {
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status);
    			alert("msdynamics__Validate: Invalid CRM User" + xhr.responseText);
    			return false;
      		}
      	}
  	};
	xhr.send(null);
	return true;
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getContactByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url +='/contacts?where=(telephone1 like \'%25' + internationalNumber + '\' or telephone1 like \'%25' +  internationalRawNumber + '\' or telephone1=\'' +  nationalNumber + '\' or telephone1=\'' +  nationalRawNumber + '\'';
		url +=' or mobilephone like \'%25' + internationalNumber + '\' or mobilephone like \'%25' +  internationalRawNumber + '\' or mobilephone=\'' +  nationalNumber + '\' or mobilephone=\'' +  nationalRawNumber + '\')';

	console.log("msdynamics__getContactByPhoneDataCall: url == " + url);

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
					console.log("msdynamics__getLeadByPhone: ");
					msdynamics__getLeadByPhone(json, msdynamics__getAccountForLeadResults);
				} else {
					console.log("Name: " + results[0].attributes.fullname + " | Tile: " + results[0].attributes.jobtitle);
					bg.setCallerName(results[0].attributes.fullname);
					bg.setContactRole(results[0].attributes.jobtitle);
					callback(results, msdynamics__dispatchAccountForContactResults);
					bg.setCrmAuthStatus(true);
				}
			} else {
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
//callback msdynamics__getLeadByPhone
function msdynamics__getLeadByPhone(json, callback) {
	var callerId = bg.getRawCallId();
    var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
    var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
    var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
    var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

    url +='/leads?where=(telephone1 like \'%25' + internationalNumber + '\' or telephone1 like \'%25' +  internationalRawNumber + '\' or telephone1=\'' +  nationalNumber + '\' or telephone1=\'' +  nationalRawNumber + '\'';
    url +=' or mobilephone like \'%25' + internationalNumber + '\' or mobilephone like \'%25' +  internationalRawNumber + '\' or mobilephone=\'' +  nationalNumber + '\' or mobilephone=\'' +  nationalRawNumber + '\')';

	console.log("msdynamics__getLeadByPhone: url == " + url);
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
					console.log("msdynamics__getAccountByPhone: ");
					msdynamics__getAccountByPhone(json, msdynamics__buildAccountListForGetContactByAccountId);
				} else {
					bg.setCallerName(results[0].attributes.fullname);
					//msdynamics__handleLeadCallResults(results);
					callback(results, msdynamics__dispatchAccountForContactResults);
					bg.setCrmAuthStatus(true);
				}
			} else {
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
//callback msdynamics__getAccountByPhone
function msdynamics__getAccountByPhone(json, callback) {
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url +='/accounts?where=(telephone1 like \'%25' + internationalNumber + '\' or telephone1 like\'%25' +  internationalRawNumber + '\' or telephone1=\'' +  nationalNumber + '\' or telephone1=\'' +  nationalRawNumber + '\')';

	console.log("msdynamics__getAccountByPhone URL == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("msdynamics__getAccountByPhone == " + xhr.status)
				console.log("msdynamics__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, msdynamics__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					callback(resp, msdynamics__dispatchContactForAccountResults)
				} else {
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else {
				bg.setContactRole('No Match Found');
				//bg.setCrmAuthStatus(false);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("msdynamics__getAccountForContactResults == " + results);
	console.log("msdynamics__getAccountForContactResults == " + acctCount);

	for ( var i = 0; i <= (results.length - 1);  i++) {
		console.log("msdynamics__getAccountForContactResults:: AccountId: " + results[i].attributes.parentcustomerid);
		msdynamics__getAccountNameById(results[i].attributes.parentcustomerid, i, results, msdynamics__dispatchAccountForContactResults);
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getAccountNameById(accountId, rownum, results, callback) {
	console.log("msdynamics__getAccountNameById == " + accountId);
	console.log("msdynamics__getAccountNameById == " + rownum);

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
				var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp.attributes.name + '"}';
				//callback(resp, str, rownum, 1);
				callback(results, str, rownum, 1);
				bg.setCrmAuthStatus(true);
			} else {
				bg.setContactRole('No Account Relationship Found');
				//bg.setCrmAuthStatus(false);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getAccountForLeadResults(results, callback) {
	var acctCount = results.length;
	console.log("msdynamics__getAccountForLeadResults == " + results);
	console.log("msdynamics__getAccountForLeadResults == " + acctCount);

	for ( var i = 0; i <= (results.length - 1);  i++) {
		console.log("msdynamics__getAccountForContactResults:: AccountId: " + results[i].attributes.parentaccountid);
		msdynamics__getAccountNameById(results[i].attributes.parentaccountid, i, results, msdynamics__dispatchAccountForContactResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__buildAccountListForGetContactByAccountId(accounts) {
	console.log("\nmsdynamics__buildAccountListForGetContactByAccountId == " + JSON.stringify(accounts));

	var jsonString;

	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].id + '", "accountName": "' + accounts[i].attributes.name + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].id + '", "accountName": "' + accounts[i].attributes.name + '"}';
		}
	}

	jsonString = '[' + jsonString + ']';
	console.log("\n\nmsdynamics__buildAccountListForGetContactByAccountId == " + JSON.stringify(jsonString));
	msdynamics__dispatchContactForAccountResults(JSON.parse(jsonString))
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__dispatchContactForAccountResults(accountData, callback) {
	console.log("\n\msdynamics__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("\n\msdynamics__dispatchContactForAccountResults == length " + accountData.length);

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/contacts?where=parentcustomerid=\'';

// Lets' make sure we don't have duplicate account ID.
	if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("msdynamics__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';

			} else {
				url += encodeURIComponent(' OR parentcustomerid=\'' +  accountData[i].accountId + '\'');
			}
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		console.log("msdynamics__dispatchContactForAccountResults == only 1 " + url);
	}
	console.log("msdynamics__dispatchContactForAccountResults ==  " + url);

	msdynamics__getContactByAccountName(accountData, url)
}

////////////////////////////////////////////////////////////////////////////////////////
//callback
function msdynamics__getContactByAccountName(accounts, url) { //, callback) {
	console.log("msdynamics__getContactByAccountName: == " + JSON.stringify(accounts));

	var header = lc.getCloudElementsId();

	console.log("msdynamics__getContactByAccountName: url == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				var results = JSON.parse( xhr.responseText );
				console.log("msdynamics__getContactByAccountName: results.length == " + results.length);
				// What if there are no results  look at accounts.
				if (results.length <= 0) {
					console.log("msdynamics__getContactByAccountName: ");
					bg.setContactRole('No Account Relationship Found');
					bg.setCrmAuthStatus(true);
				} else {
					msdynamics__dispatchContentByAccountId(accounts, msdynamics__getContentByAccountId);
					msdynamics__handleContactsByAccountById('any', results, accounts);//, msdynamics__dispatchContactForAccountResults)
					bg.setCrmAuthStatus(true);
				}
			} else if ( xhr.status == 401 ){
				bg.setContactRole('No Account Relationship Found');
				alert("CRM Unauthorized Access");
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			} else {
				bg.setContactRole('No Account Relationship');
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}

	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function msdynamics__dispatchAccountForContactResults(results, acctdata, iteration, retcount) {
	acctCount += retcount;
	console.log("msdynamics__dispatchAccountForContactResults == " + acctCount);
	console.log("msdynamics__dispatchAccountForContactResults == " + results);
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}

	if (acctCount == results.length) {
		//acctResult = '[' + acctResult + ']';

		msdynamics__dispatchContentByAccountId(JSON.parse('[' + acctResult + ']'), msdynamics__getContentByAccountId); // Activities
		msdynamics__handleCallResults('incident', results, JSON.parse('[' + acctResult + ']'));
	}
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__handleCallResults(type, contacts, accounts) {
	console.log("msdynamics__handleCallResults == " + type);
	acctCount = 0;
	var rowCount = contacts.length;
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();

	if (contacts.length) {
		achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + (contacts.length + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
			"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
			"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
			"rowend"   : 	'</tr>'
		});
	}
	console.log("Accounts len: " + accounts.length)

	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		console.log("Contact: " + JSON.stringify(contacts[i]))
		console.log("Accounts: " + JSON.stringify(accounts[i]))

		var name = contacts[i].attributes.fullname;
		var acctId = contacts[i].attributes.parentcustomerid;
		var id = contacts[i].id;
		var acctname = accounts[i].accountName;
		nameDict[id] = name;
		achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
			"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
			"rowend"   : 	'</tr>'
		});
	}
	bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__handleLeadCallResults(leads) {
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();
	

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
		var name = leads[i].attributes.fullname;
		var id = leads[i].id;
		nameDict[id] = name;
		achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="create" type="activities"  uid="'+ id + '" >New...</td>',
			"rowend"   : 	'</tr>'
		});
	}
	
	bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}

////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback
function msdynamics__dispatchContentByAccountId(accounts, callback) {

	console.log("\n\msdynamics__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.log("msdynamics__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;

	if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("msdynamics__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				if (lc.getContentPrimary() == 'activities') {//regardingobjectid
					uri = 'regardingobjectid=\''+ accounts[i].accountId + '\'';

				} else if (lc.getContentPrimary() == 'opportunities') {//parentaccountid
					uri = 'parentaccountid=\''+ accounts[i].accountId + '\'';
				}
			} else {
				if (lc.getContentPrimary() == 'activities') {//regardingobjectid
					uri = ' OR regardingobjectid=\''+ accounts[i].accountId + '\'';

				} else if (lc.getContentPrimary() == 'opportunities') {//parentaccountid
					uri = ' OR parentaccountid=\''+ accounts[i].accountId + '\'';
				}
			}
		}
	} else if (accounts.length == 1){
		if (lc.getContentPrimary() == 'activities') {//regardingobjectid
			uri = 'regardingobjectid=\''+ accounts[0].accountId + '\'';

		} else if (lc.getContentPrimary() == 'opportunities') {//parentaccountid
			uri = 'parentaccountid=\''+ accounts[0].accountId + '\'';
		}
		console.log("msdynamics__dispatchContentByAccountId == only 1 " + uri);
	}

	console.log("msdynamics__dispatchContentByAccountId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__handleContactsByAccountById(type, contacts, accounts) {
	console.log("msdynamics__handleContactsByAccountById: type == " + type);
	console.log("msdynamics__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	var acctdict = {}
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
		var name = contacts[i].attributes.fullname;
		nameDict[contacts[i].Id] = name;
		var acctId = contacts[i].attributes.parentcustomerid; 
		var id = contacts[i].Id;
		var acctname = acctdict[acctId];

		achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
			"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
			"rowend"   : 	'</tr>'
		});
	}

	bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getContentByAccountId(uri) {
	console.log("\n" +lc.getContentPrimary() + "\nmsdynamics__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	if (lc.getContentPrimary() == 'activities') {
		url += '/activities?where=(statuscode != 5) AND' + uri;

	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/opportunities?where=(statuscode != 4 and statuscode != 3) and' + uri;
	}

	console.log("\n" + lc.getContentPrimary() + "\nmsdynamics__getContentByAccountId == " + url);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("msdynamics__getContentByAccountId == " + xhr.status)
				//console.log("msdynamics__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("msdynamics__getAccountById == " + acctId);
				console.log("msdynamics__getContentByAccountId == " + JSON.stringify(resp, null, 2));

				if (lc.getContentPrimary() == 'activities') {
					msdynamics__dispatchNameForActivity(resp, msdynamics__handleContentResults);
				} else {
					msdynamics__handleContentResults(resp);
				}
				bg.setCrmAuthStatus(true);
			} else {
				bg.setContactRole('No Account Relationship Found');
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__dispatchNameForActivity(content, msdynamics__handleContentResults) {
	var uri;

	console.log('msdynamics__dispatchNameForActivity results = ' + content.length);
	for ( var i = 0; i <= (content.length - 1 );  i++) {
		console.log('msdynamics__dispatchNameForActivity == ' + i + " " + content[i].attributes.regardingobjectid);
		if (i == 0) {
			uri = 'accountid=\''+ content[i].attributes.regardingobjectid + '\'';
		} else {
			uri += ' OR accountid=\'' +  content[i].attributes.regardingobjectid + '\'';
		}
	}
	console.log('msdynamics__dispatchNameForActivity url = ' + uri)

	msdynamics__getAccountByIds(uri, content, msdynamics__handleContentResults);
}
////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__getAccountByIds(uri, content, msdynamics__handleContentResults) {

	var callerId = bg.getRawCallId();
	var clid = callerId.substring(2);
	var fmtCallId = bg.getFormattedCallID();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=' + uri;
	var header = lc.getCloudElementsId();

	console.log("msdynamics__getContactByPhoneDataCall: url == " + url);

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
					bg.setContactRole('No Account Name Found');
					console.log("msdynamics__getContactByIds: ");
				} else {
					console.log("msdynamics__getContactByIds: " + JSON.stringify(results, null, 2));
					msdynamics__buildNameDict(results, content, msdynamics__handleContentResults)
					bg.setCrmAuthStatus(true);
				}
			} else {
				bg.setContactRole('No Account Name Found');
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}

	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__buildNameDict(results, content, msdynamics__handleContentResults ) {
	console.log('msdynamics__buildNameDict results = ' + results.length);
	for ( var i = 0; i <= (results.length - 1 );  i++) {

		console.log('Account Id : ' + results[i].attributes.accountid + ' name ' + results[i].attributes.fullname);
		nameDict[results[i].attributes.accountid] = results[i].attributes.name;
	}
	console.log('msdynamics__buildNameDict url = ' + JSON.stringify(nameDict, null, 2));
	msdynamics__handleContentResults(content);
}

////////////////////////////////////////////////////////////////////////////////////////
function msdynamics__handleContentResults(content) {

	var contentUrl;
	var rowCount = content.length;
	console.log("msdynamics__handleContentResults: rowCount == " + rowCount);
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	
	console.log('msdynamics__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));
	if (rowCount) {
		if (lc.getContentPrimary() == 'activities') {
			theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Type</th>',
				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Account</th>',
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
				"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Timeframe</th>',
				"rowend"   : 	'</tr>'
			});
		}
	}

	for ( var i = 0; i <= (content.length - 1);  i++) {
		if (lc.getContentPrimary() == 'activities') {

			var subtype = content[i].attributes.activitytypecode;
			var id = content[i].id;
			var status = content[i].attributes.statuscode;
			var date = content[i].attributes.scheduledend;
			console.log("msdynamics__handleContentResults: WhoId == " + content[i].id);
			var col1 = content[i].attributes.activitytypecode || 'Not Defined';    			// Type			//
			console.log("search for " + content[i].attributes.regardingobjectid)
			var col2 = nameDict[content[i].attributes.regardingobjectid];						// Name ,-- Get the contact names
			var col3 = content[i].attributes.subject;								// Subject
			var col4 = bg.formatDate(date); 								//Date

		} else if (lc.getContentPrimary() == 'opportunities') {

			var col1 = 'Not Defined';

			switch (content[i].attributes.salesstagecode)
			{
				case 1:
					col1 = 'In Progress';
					break;
				case 2:
					col1 = 'On Hold';
					break;
			}
			var col2 = content[i].attributes.name;				//Name
			var col3 = content[i].attributes.totalamount_base || 'Not Defined';		//MRR
			var col4 = 'unknown';

			switch (content[i].attributes.purchasetimeframe)
			{
				case 0:
					col4 = 'Immediate';
					break;
				case 1:
					col4 = 'This Quarter';
					break;
				case 2:
					col4 = 'Next Quarter';
					break;
				case 3:
					col4 = 'This Year';
					break;
			}


			var id = content[i].id;
		}

		if (i >= 0) {
			contentJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" subtype="'+ subtype + '" contentid="'+ id + '" class="contacts-table-name">' + col1 + '</td>',
				"cell_2"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" subtype="'+ subtype + '" contentid="'+ id + '" class="contacts-table-name">' + col2 + '</td>',
				"cell_3"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" subtype="'+ subtype + '" contentid="'+ id + '" class="contacts-table-name">' + col3 + '</td>',
				"cell_4"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" subtype="'+ subtype + '" contentid="'+ id + '" class="contacts-table-name">' + col4 + '</td>',
				"rowend"   : 	'</tr>'
			});
		}

	}
	
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
}
