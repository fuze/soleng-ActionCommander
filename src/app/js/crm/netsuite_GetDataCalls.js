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
exports.netsuite__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);


	console.log("netsuite__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("netsuite__callHandler: "+ callState +" Caller ID == " + json.direction);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;

		util.setCallData(callState, json);
		netsuite__getContactByPhone(json, netsuite__getAccountForContactResults);
		
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("netsuite__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};

////////////////////////////////////////////////////////////////////////////////////////
function netsuite__getContactByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/contacts?where=(phone like \'' + internationalNumber + '\' or phone like \'' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';
	console.log("netsuite__getContactByPhoneDataCall: url == " + url);
	
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
    				console.log("netsuite__getContactByPhone: ");
    				netsuite__getAccountByPhone(json, netsuite__buildAccountListForGetContactByAccountId);
    			} else {
					console.log("netsuite__getContactByPhone == " + JSON.stringify(results, null, 2));

					bg.setCallerName(results[0].firstName + ' ' + results[0].lastName);
    				bg.setContactRole(results[0].salutation);
					if (results.length == 1)
						bg.setUserConnectorAcct(results[0].internalId);

					bg.setAcctConnectorID(results[0].company.internalId);
    			    netsuite__getAccountForContactResults(results, netsuite__dispatchAccountForContactResults);
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
function netsuite__getAccountNameById(accountId, rownum, results, callback) {
	console.log("netsuite__getAccountNameById == " + accountId);
	console.log("netsuite__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts?where=internalId=\''+ accountId + '\'';
	
	console.log("netsuite__getAccountNameById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
			console.log("netsuite__getAccountNameById: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
			console.log("netsuite__getAccountNameById: length == <" + resp.length + ">");
				if (resp.length > 0) {
					console.log("netsuite__getAccountNameById: resp.Name == <" + resp[0].entityId + ">");
					console.log("\n\n\n");
					var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].entityId + '"}';
					//callback(resp, str, rownum, 1);
					callback(results, str, rownum, 1);
				}
				bg.setCrmAuthStatus(true);
			} else {
				console.error("netsuite__getAccountNameById: xhr.responseText = " + xhr.responseText);
				console.error("netsuite__getAccountNameById: xhr.status = " + xhr.status);
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// the First Contact Result Callback 
function netsuite__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("netsuite__getAccountForContactResults == " + JSON.stringify(results));
	console.log("netsuite__getAccountForContactResults == " + acctCount);
	
	for ( var i = 0; i <= (results.length - 1);  i++) {
		var acct = results[i].company.internalId;
		console.log("netsuite__getAccountForContactResults == " + acct + " i " + i + " length " + results.length);
		netsuite__getAccountNameById(acct, i, results, netsuite__dispatchAccountForContactResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function netsuite__dispatchAccountForContactResults(contacts, acctdata, iteration, retcount) {
	acctCount += retcount;
	console.log("netsuite__dispatchAccountForContactResults == " + JSON.stringify(acctdata));

	console.log("netsuite__dispatchAccountForContactResults == " + acctCount);
	console.log("netsuite__dispatchAccountForContactResults == " + JSON.stringify(contacts));
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}
	
	if (acctCount == contacts.length) {
		//acctResult = '[' + acctResult + ']';
		
		netsuite__dispatchContentByAccountId(contacts, JSON.parse('[' + acctResult + ']'), netsuite__getContentByAccountId); // Activities
		netsuite__handleCallResults('incident', contacts, JSON.parse('[' + acctResult + ']'));
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function netsuite__handleCallResults(type, contacts, accounts) {
console.log("netsuite__handleCallResults == " + type);
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
		var name = contacts[i].firstName + ' ' + contacts[i].lastName
		var acctId = contacts[i].company.internalId;
		var id = contacts[i].internalId;
		var acctname = accounts[i].accountName;
		nameDict[id] = name;

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
// the Build URL for Incident  Result Callback 
function netsuite__dispatchContentByAccountId(contacts, accounts, callback) {
	
	console.log("\n\netsuite__dispatchContentByAccountId == " + JSON.stringify(contacts));
	console.log("\n\netsuite__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.log("netsuite__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;
	var attribute = "";

	if (lc.getContentPrimary() == 'activities') {
		attribute = 'company';
	} else if (lc.getContentPrimary() == 'opportunities') {
		attribute = 'entity';
	}

	 if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("netsuite__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = attribute + '=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR ' + attribute + '=\'' +  accounts[i].accountId + '\'';
			}
			console.log("netsuite__dispatchContentByAccountId == AccountId " + accounts.length);
		}
	} else if (accounts.length == 1){
		uri += attribute + '=\''+  accounts[0].accountId + '\'';
		console.log("netsuite__dispatchContentByAccountId == only 1 " + uri);
	}
	
	console.log("netsuite__dispatchContentByAccountId == url " + uri );
	netsuite__getContentByAccountId(contacts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function netsuite__getContentByAccountId(contacts, uri) {
	console.log("\n" +lc.getContentPrimary() + "\nnetsuite__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	
	if (lc.getContentPrimary() == 'activities') {
		url += '/activities?where=' + uri;
	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/opportunities?where=' + uri;
	}
	
	console.log("\n" + lc.getContentPrimary() + "\nnetsuite__getContentByAccountId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\nnetsuite__getContentByAccountId == " + url);
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
    			//console.log("netsuite__getAccountById == " + uri);
    			console.log("netsuite__getContentByAccountId == " + JSON.stringify(resp, null, 2));
    			if (resp.length > 0) {
    				//if ((bg.getContentPrimary() == 'activities') || (bg.getContentPrimary() == 'opportunities')) {
    				// if (bg.getContentPrimary() == 'activities') {
    				// 	netsuite__dispatchNameForActivity(contacts, resp, netsuite__handleContentResults);
    				// } else {
    				// 	netsuite__handleContentResults(resp);
    				// }
					netsuite__handleContentResults(resp);

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
function netsuite__dispatchNameForActivity(contacts, content, netsuite__handleContentResults) {
	var uri;
	console.log('netsuite__dispatchNameForActivity contacts = ' + contacts.length);
	console.log('netsuite__dispatchNameForActivity content = ' + content.length);
	if (content.length == 0) {
		netsuite__buildNameDict(contacts, content, netsuite__handleContentResults)
	} else {
		console.log('netsuite__dispatchNameForActivity results = ' + JSON.stringify(content, null, 2))
		console.log('netsuite__dispatchNameForActivity results = ' + content.length);
		for ( var i = 0; i <= (content.length - 1 );  i++) {
			console.log('netsuite__dispatchNameForActivity == ' + i + " " + content[i].WhoId);
			if (i == 0) {
				uri = 'Id=\''+ content[i].WhoId + '\'';
			} else {
				uri += ' OR Id=\'' +  content[i].WhoId + '\'';
			}
		}
		console.log('netsuite__dispatchNameForActivity url = ' + uri)
		netsuite__getContactByIds(uri, content, netsuite__handleContentResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function netsuite__getContactByIds(uri, content, netsuite__handleContentResults) {
	
	var callerId = bg.getRawCallId();
	var clid = callerId.substring(2);
	var fmtCallId = bg.getFormattedCallID();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url +='/contacts?where=' + uri;
	var header = lc.getCloudElementsId();

	console.log("netsuite__getContactByIds: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.log("netsuite__getContactByIds: " + results.length);
    			if (results.length <= 0) {
    				console.log("netsuite__getContactByIds: ");
    			} else {
    				console.log("netsuite__getContactByIds: " + JSON.stringify(results, null, 2));
    				netsuite__buildNameDict(results, content, netsuite__handleContentResults)
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
function netsuite__buildNameDict(results, content, netsuite__handleContentResults ) {
	console.log('netsuite__buildNameDict results = ' + results.length);
	for ( var i = 0; i <= (results.length - 1 );  i++) {
		nameDict[results[i].Id] = results[i].Name; 
	}
	console.log('netsuite__buildNameDict url = ' + JSON.stringify(nameDict, null, 2));
	netsuite__handleContentResults(content);
}

////////////////////////////////////////////////////////////////////////////////////////
function netsuite__handleContentResults(content) {
	
	var contentUrl;
	var rowCount = content.length;
	console.log("netsuite__handleContentResults: rowCount == " + rowCount);
		var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
console.log('netsuite__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));
	if (rowCount) {
		if (lc.getContentPrimary() == 'activities') {
    		theadJson.dataRows.push({
    			"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Contact</th>',
       			"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Subject</th>',
    			"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Due Date</th>',
				"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Status</th>',
       			"rowend"   : 	'</tr>'
	    	});
	    } else if (lc.getContentPrimary() == 'opportunities') {

	    
	    		theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Status</th>',
   				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Name</th>',
   				"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Weighted Total</th>',
       			"cell_4"   : 	'<th id="content-head-3" class="contacts-table">Close Date</th>',
       			"rowend"   : 	'</tr>'
	    	});
	    }
	}
	
	for ( var i = 0; i <= (content.length - 1);  i++) {
		if (lc.getContentPrimary() == 'activities') {

			var id = content[i].internalId;
			var date = content[i].endDate;

			//var col1 = content[i].Type || 'Not Defined';    			// Type			//
			var col1 = content[i].contact.name;						// Name ,-- Get the contact names
			var col2 = content[i].title;								// Subject
			var col3 = date.slice(0, 10); 								//Date
			var col4 = content[i].status.value;								// Subject

		} else if (lc.getContentPrimary() == 'opportunities') {
			var col1 = content[i].status || 'Not Defined';  			//Stage
			var col2 = content[i].title;
			var col3 = content[i].weightedTotal || '0';
			var date = content[i].expectedCloseDate;

			var col4 = date.slice(0, 10);							//Close Date
			var id = content[i].internalId;
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
////////////////////////////////////////////////////////////////////////////////////////
//callback netsuite__getAccountByPhone
function netsuite__getAccountByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	
console.log("netsuite__getAccountByPhone == " + json);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts?where=(phone like \'' + internationalNumber + '\' or phone like \'' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("netsuite__getAccountByPhone == " + xhr.status)
				console.log("netsuite__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, netsuite__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0))
				{
					bg.setAcctConnectorID(resp[0].internalId);

					callback(resp, netsuite__dispatchContactForAccountResults)
				} else {
					// Look for a Users ....
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.error("xhr.responseText = " + xhr.responseText);
				console.error("xhr.status = " + xhr.status);
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
function netsuite__buildAccountListForGetContactByAccountId(accounts) {
console.log("\n\netsuite__dispatchContactForAccountResults == " + JSON.stringify(accounts));
	
	var jsonString;
	
	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].internalId + '", "accountName": "' + accounts[i].entityId + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].internalId + '", "accountName": "' + accounts[i].entityId + '"}';
		}
	}
	
	jsonString = '[' + jsonString + ']';
	console.log("\n\nnetsuite__dispatchContactForAccountResults == " + JSON.stringify(jsonString));
	netsuite__dispatchContactForAccountResults(JSON.parse(jsonString), netsuite__getContactByAccountId)
}
////////////////////////////////////////////////////////////////////////////////////////
function netsuite__dispatchContactForAccountResults(accountData, callback) {
	console.log("\n\netsuite__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("\n\netsuite__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=company=\'';
// Lets' make sure we don't have duplicate account ID.
	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("netsuite__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';
	
			} else {
				url += encodeURIComponent(' OR company=\'' +  accountData[i].accountId + '\'');
			}
			//console.log("netsuite__dispatchContactForAccountResults == AccountId " + results.length);
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		console.log("netsuite__dispatchContactForAccountResults == only 1 " + url);
	}
	console.log("netsuite__dispatchContactForAccountResults ==  " + url);
	netsuite__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function netsuite__getContactByAccountId(accounts, url) { //, callback) {
	console.log("netsuite__getContactByAccountId: == " + JSON.stringify(accounts));
	
	var header = lc.getCloudElementsId();

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );

				console.log("netsuite__getContactByAccountId: results.length == " + results.length);
				console.log("\n\n");
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				console.log("netsuite__getContactByAccountId: ");
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    			  	netsuite__dispatchContentByAccountId(results, accounts, netsuite__getContentByAccountId);
    				netsuite__handleContactsByAccountById('any', results, accounts);//, netsuite__dispatchContactForAccountResults)
    			    bg.setCrmAuthStatus(true);
    			    return true;
    			} 
      		} else if ( xhr.status == 401 ){ 
      			//bg.setCrmAuthStatus(false);
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


function netsuite__handleContactsByAccountById(type, contacts, accounts) {
	console.log("netsuite__handleContactsByAccountById: type == " + type);
	console.log("netsuite__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	acctDict = {}
	accounts.forEach(function(accounts) {
		acctDict[accounts.accountId] = accounts.accountName
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
		var name = contacts[i].firstName + ' ' + contacts[i].lastName
		var acctId = contacts[i].company.internalId;
		var id = contacts[i].internalId;
		var acctname = acctDict[acctId];
		nameDict[id] = name;

		
    	 jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }

	bg.setAnchorTableData(JSON.stringify(jsonString));
}
