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
var acctDict = {};
///////////////////////////////////////////////////////////////
exports.pgaTour__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);

	console.log("pgaTour__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("pgaTour__callHandler: "+ callState +" Caller ID == " + json.direction);
	console.log("pgaTour__callHandler: "+ callState +" Caller ID == " + json.dialedNumber);
	
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		if(!_accountHandled && json.dialedNumber != 'Unknown') {
			pgaTour__get_AccountByNumberDialed(json, pgaTour__get_ScriptToPop);
			_accountHandled = true;
		}
		
		util.setCallData(callState, json);
		pgaTour__getContactByPhone(json, pgaTour__getAccountForContactResults);
		
	} else if (callState == 'CONNECT') {
		if(!_accountHandled && json.dialedNumber != 'Unknown') {
			pgaTour__get_AccountByNumberDialed(json, pgaTour__get_ScriptToPop);
			_accountHandled = true;
		}
		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("pgaTour__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
		_accountHandled = false;
	}

};

///////////////////////////////////////////////////////////////
function pgaTour__Validate(callback) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/ping';
	var header = lc.getCloudElementsId();
	console.log("pgaTour__Validate: " + url);
	console.log("pgaTour__Validate: " + header);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			console.log("pgaTour__Validate: resp.success == " + xhr.responseText)
    			var resp = JSON.parse( xhr.responseText );
    			if ( typeof resp.endpoint == 'string' ) { 
    				console.log("pgaTour__Validate: User Validated ");
    				bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("pgaTour__Validate: Invalid CRM User" + xhr.responseText);
    			return false;
      		}
      	}  
  	}; 
	xhr.send(null);
	return true;
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__getContactByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url +='/contacts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\'';
		url +=' or MobilePhone like \'%25' + internationalNumber + '\' or MobilePhone like \'%25' +  internationalRawNumber + '\' or MobilePhone=\'' +  nationalNumber + '\' or MobilePhone=\'' +  nationalRawNumber + '\')';

	console.log("pgaTour__getContactByPhoneDataCall: url == " + url);

	
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
    				console.log("pgaTour__getContactByPhone: ");
    				pgaTour__getAccountByPhone(json, pgaTour__buildAccountListForGetContactByAccountId);
    			} else {
    				bg.setCallerName(results[0].Name);
    				bg.setContactRole(results[0].Title);
    			    pgaTour__getAccountForContactResults(results, pgaTour__dispatchAccountForContactResults);
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
function pgaTour__getAccountNameById(accountId, rownum, results, callback) {
	console.log("pgaTour__getAccountNameById == " + accountId);
	console.log("pgaTour__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts?where=Id=\''+ accountId + '\'';
	
console.log("pgaTour__getAccountNameById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
			console.log("pgaTour__getAccountNameById: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
			console.log("pgaTour__getAccountNameById: length == <" + resp.length + ">");
				if (resp.length > 0) {
					console.log("pgaTour__getAccountNameById: resp.Name == <" + resp[0].Name + ">");
					console.log("\n\n\n");
					var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].Name + '"}';
					//callback(resp, str, rownum, 1);
					callback(results, str, rownum, 1);
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("pgaTour__getAccountNameById: xhr.responseText = " + xhr.responseText);
				console.log("pgaTour__getAccountNameById: xhr.status = " + xhr.status);
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// the First Contact Result Callback 
function pgaTour__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("pgaTour__getAccountForContactResults == " + JSON.stringify(results));
	console.log("pgaTour__getAccountForContactResults == " + acctCount);
	
	for ( var i = 0; i <= (results.length - 1);  i++) {
		var acct = results[i].AccountId
		console.log("pgaTour__getAccountForContactResults == " + acct + " i " + i + " length " + results.length);
		pgaTour__getAccountNameById(acct, i, results, pgaTour__dispatchAccountForContactResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function pgaTour__dispatchAccountForContactResults(contacts, acctdata, iteration, retcount) {
	acctCount += retcount; 
	console.log("pgaTour__dispatchAccountForContactResults == " + acctCount);
	console.log("pgaTour__dispatchAccountForContactResults == " + JSON.stringify(contacts));
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}
	
	if (acctCount == contacts.length) {
		//acctResult = '[' + acctResult + ']';

		pgaTour__dispatchContentByContactId(contacts, JSON.parse('[' + acctResult + ']'), pgaTour__getContentByAccountId); // Activities
		pgaTour__handleCallResults('incident', contacts, JSON.parse('[' + acctResult + ']'));
	}	
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__handleCallResults(type, contacts, accounts) {
console.log("pgaTour__handleCallResults == " + type);
acctCount = 0;
	var rowCount = contacts.length;
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();
	
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
		var name = contacts[i].Name
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
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
// the Build URL for Incident  Result Callback 
function pgaTour__dispatchContentByAccountId(contacts, accounts, callback) {
	
	console.log("\n\pgaTour__dispatchContentByAccountId == " + JSON.stringify(contacts));
	console.log("\n\pgaTour__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.log("pgaTour__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;
	 	
	 if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("pgaTour__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = 'Account__c=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR Account__c=\'' +  accounts[i].accountId + '\'';
			}
			console.log("pgaTour__dispatchContentByAccountId == Account__c " + accounts.length);
		}
	} else if (accounts.length == 1){
		uri += 'Account__c=\''+  accounts[0].accountId + '\'';
		console.log("pgaTour__dispatchContentByAccountId == only 1 " + uri);
	}
	
	console.log("pgaTour__dispatchContentByAccountId == url " + uri );
	pgaTour__getContentByAccountId(contacts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__dispatchContentByContactId(contacts, accounts, callback) {

	console.log("\n\ppgaTour__dispatchContentByContactId == " + JSON.stringify(contacts));
	console.log("\n\ppgaTour__dispatchContentByContactId == " + JSON.stringify(accounts));
	console.log("pgaTour__dispatchContentByContactId == " + accounts.length + "\n\n");
	var uri;

	if (contacts.length >= 1) {
		for ( var i = 0; i <= (contacts.length - 1);  i++) {
			console.log("pgaTour__dispatchContentByContactId == in for loop AccountId " + contacts.length);
			if (i == 0) {
				uri = 'Member__c=\''+ contacts[i].Id + '\'';
			} else {
				uri += ' OR Member__c=\'' +  contacts[i].Id + '\'';
			}
			console.log("pgaTour__dispatchContentByContactId == AccountId " + contacts.length);
		}
	} else if (contacts.length == 1){
		uri += 'Member__c=\''+  contacts[0].Id + '\'';
		console.log("pgaTour__dispatchContentByContactId == only 1 " + uri);
	}

	console.log("pgaTour__dispatchContentByContactId == url " + uri );
	pgaTour__getContentByContactId(contacts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__getContentByAccountId(contacts, uri) {
	console.log("\n" +lc.getContentPrimary() + "\npgaTour__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	
		url += '/Reservation__c?where=' + uri;
	
	console.log("\n" + lc.getContentPrimary() + "\npgaTour__getContentByAccountId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\npgaTour__getContentByAccountId == " + url);
	var header = lc.getCloudElementsId();
	
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				//console.log("pgaTour__getContentByAccountId == " + xhr.status)
				//console.log("pgaTour__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
    			//console.log("pgaTour__getAccountById == " + uri);
    			console.log("pgaTour__getContentByAccountId == " + JSON.stringify(resp, null, 2));
    			if (resp.length > 0) {
					pgaTour__handleContentResults(resp);
    			}
    			bg.setCrmAuthStatus(true);
			} else { 
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status); 
			}
		}
    }  
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__getContentByContactId(contacts, uri) {
	console.log("\n" +lc.getContentPrimary() + "\npgaTour__getContentByContactId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url += '/Reservation__c?where=' + uri;

	console.log("\n" + lc.getContentPrimary() + "\npgaTour__getContentByContactId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\npgaTour__getContentByContactId == " + url);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("pgaTour__getContentByAccountId == " + xhr.status)
				//console.log("pgaTour__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("pgaTour__getAccountById == " + uri);
				console.log("pgaTour__getContentByContactId == " + JSON.stringify(resp, null, 2));
				if (resp.length > 0) {
					pgaTour__handleContentResults(resp);

				}
				bg.setCrmAuthStatus(true);
			} else {
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__handleContentResults(content) {
	
	var contentUrl;
	var rowCount = content.length;
	console.log("pgaTour__handleContentResults: rowCount == " + rowCount);
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();

	console.log('pgaTour__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));
	if (rowCount) {
    		theadJson.dataRows.push({
    			"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Name</th>',
       			"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Status</th>',
    			"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Course Categ.</th>',
				"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Num. of Players</th>',
       			"rowend"   : 	'</tr>'
	    	});

	}
	
	for ( var i = 0; i <= (content.length - 1);  i++) {

			var id = content[i].Id;

			var col1 = content[i].Name;
			var col2 = content[i].Status__c;
			var col3 = content[i].Course_Category__c;
			var col4 = content[i].Requested_Number_of_Players__c;
		
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
////////////////////////////////////////////////////////////////////////////////////////
//callback pgaTour__getAccountByPhone
function pgaTour__getAccountByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	
	console.log("pgaTour__getAccountByPhone == " + json);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("pgaTour__getAccountByPhone == " + xhr.status)
				console.log("pgaTour__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, pgaTour__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					callback(resp, pgaTour__dispatchContactForAccountResults)
				} else {
					// Look for a Users ....
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
/*
If Getting User is successful display
If not successful display No Match and prompt for new user and Opportunit/activity/ticket creation.
then create the contact (pop screen) and Create Ticket (pop screen)
*/
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__buildAccountListForGetContactByAccountId(accounts) {
console.log("\n\pgaTour__dispatchContactForAccountResults == " + JSON.stringify(accounts));
	
	var jsonString;
	
	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		}
	}
	
	jsonString = '[' + jsonString + ']';
	console.log("\n\npgaTour__dispatchContactForAccountResults == " + JSON.stringify(jsonString));
	pgaTour__dispatchContactForAccountResults(JSON.parse(jsonString), pgaTour__getContactByAccountId)
}
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__dispatchContactForAccountResults(accountData, callback) {
	console.log("\n\pgaTour__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("\n\pgaTour__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=AccountId=\'';
// Lets' make sure we don't have duplicate account ID.
	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("pgaTour__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';
	
			} else {
				url += encodeURIComponent(' OR AccountId=\'' +  accountData[i].accountId + '\'');
			}
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		console.log("pgaTour__dispatchContactForAccountResults == only 1 " + url);
	}
	console.log("pgaTour__dispatchContactForAccountResults ==  " + url);
	pgaTour__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function pgaTour__getContactByAccountId(accounts, url) { //, callback) {
	console.log("pgaTour__getContactByAccountId: == " + JSON.stringify(accounts));
	
	var header = lc.getCloudElementsId();

	console.log("pgaTour__getContactByAccountId: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.log("pgaTour__getContactByAccountId: results.length == " + results.length);
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				console.log("pgaTour__getContactByAccountId: ");
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    			  	pgaTour__dispatchContentByAccountId(results, accounts, pgaTour__getContentByAccountId);
    				pgaTour__handleContactsByAccountById('any', results, accounts);//, pgaTour__dispatchContactForAccountResults)
    			    bg.setCrmAuthStatus(true);
    			    return true;
    			} 
      		} else if ( xhr.status == 401 ){ 
      			//bg.setCrmAuthStatus(false);
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
function pgaTour__handleContactsByAccountById(type, contacts, accounts) {
	console.log("pgaTour__handleContactsByAccountById: type == " + type);
	console.log("pgaTour__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	acctDict = {}
	accounts.forEach(function(accounts) {
    		acctDict[accounts.accountId] = accounts.accountName
	});
	
	var rowCount = contacts.length;
	var jsonString = {};
	jsonString.dataRows = new Array();
	
	if (rowCount) {
    	// jsonString.dataRows.push({
    	// 	"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
			// "cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
        	// "cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
       	// 	"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
       	// 	"rowend"   : 	'</tr>'
	    // });
	}
	
	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		var name = contacts[i].Name; 
		nameDict[contacts[i].Id] = contacts[i].Name;
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = acctDict[contacts[i].AccountId];
		
    	 jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    
	bg.setAnchorTableData(JSON.stringify(jsonString));
} 
////////////////////////////////////////////////////////////////////////////////////////
function pgaTour__getAccountScript(json, callback) {
	var numberdialed = json.dialedNumber;
	
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(numberdialed, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(numberdialed, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(numberdialed, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(numberdialed, phoneNumberPattern.NationalRaw);
	
	console.log("pgaTour__getAccountScript == " + json);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("pgaTour__getAccountScript == " + xhr.status)
				console.log("pgaTour__getAccountScript == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					callback(resp[0].Name)
				} else {
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
	
}
////////////////////////////////////////////////////////////////////////////////////////
//callback pgaTour__get_AccountBynumberDialed
function pgaTour__get_AccountByNumberDialed(json, callback) {
	var dialedNum = json.dialedNumber;
		console.warn("pgaTour__get_AccountByNumberDialed == " + dialedNum);
	var internationalNumber = ph.getPhoneNumberPattern(dialedNum, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(dialedNum, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(dialedNum, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(dialedNum, phoneNumberPattern.NationalRaw);
	
	console.warn("pgaTour__get_AccountByNumberDialed == " + json);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("pgaTour__get_AccountByNumberDialed == " + xhr.status)
				console.log("pgaTour__get_AccountByNumberDialed == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					//console.log("pgaTour__get_AccountByNumberDialed == " + JSON.stringify(resp))
					var name = resp[0].Name;
					console.log("pgaTour__get_AccountByNumberDialed == " + resp[0].Name)
					callback(resp[0].Name)
				} else {
					bg.setContactRole('No Account results for' + getPhoneNumberForUI(dialedNum));
					console.log('pgaTour__get_AccountByNumberDialed: No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
//callback pgaTour__getScriptToPop
function pgaTour__get_ScriptToPop(name) {
	console.log("pgaTour__get_ScriptToPop == " + name )
	
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/ContentDocument?where=Title like \'' + name + '%Script\'';
	console.log("pgaTour__get_ScriptToPop == " +  url)
	url = encodeURI(url);
	
	console.log("pgaTour__get_ScriptToPop == " +  url)
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("pgaTour__get_ScriptToPop == " + xhr.status)
				console.log("pgaTour__get_ScriptToPop == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					console.log("pgaTour__get_ScriptToPop == " + JSON.stringify(resp))
					var docUrl = resp[0].Description; 
					console.log('pgaTour__get_ScriptToPop: Script ' + docUrl);
					bg.showPgaScriptWindow(docUrl);
					//var new_window = window.open(docUrl, "CallScript" + resp.Id );
					//callback(resp, pgaTour__dispatchContactForAccountResults)
				} else {
					bg.setContactRole('No Script For' + name );//getPhoneNumberForUI(dialedNum));
					console.log('pgaTour__get_ScriptToPop: No Script For ' + name);
					bg.setCrmAuthMessage('No Script For ' + name);
					
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
} 
