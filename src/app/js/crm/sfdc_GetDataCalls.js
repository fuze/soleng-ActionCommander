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
exports.sfdc__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);


	console.log("sfdc__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("sfdc__callHandler: "+ callState +" Caller ID == " + json.direction);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		sfdc__getContactByPhone(json, sfdc__getAccountForContactResults);
		
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.debug("sfdc__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};


////////////////////////////////////////////////////////////////////////////////////////
function sfdc__getContactByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url +='/contacts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\'';
		url +=' or MobilePhone like \'%25' + internationalNumber + '\' or MobilePhone like \'%25' +  internationalRawNumber + '\' or MobilePhone=\'' +  nationalNumber + '\' or MobilePhone=\'' +  nationalRawNumber + '\')';

	console.debug("sfdc__getContactByPhoneDataCall: url == " + url);

	
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
    				console.log("sfdc__getContactByPhone: ");
    				sfdc__getAccountByPhone(json, sfdc__buildAccountListForGetContactByAccountId); 
    			} else {
    				bg.setCallerName(results[0].Name);
    				bg.setContactRole(results[0].Title);
    				if (results.length == 1) {
						bg.setUserConnectorAcct(results[0].Id);
					}
					bg.setAcctConnectorID(results[0].AccountId);
    			    sfdc__getAccountForContactResults(results, sfdc__dispatchAccountForContactResults);
    			    bg.setCrmAuthStatus(true);
    			} 
      		} else { 
      			console.error("xhr.responseText = " + xhr.responseText);
    			console.error("xhr.status = " + xhr.status); 
      		}
      	}  
  		
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__getAccountNameById(accountId, rownum, results, callback) {
	console.debug("sfdc__getAccountNameById == " + accountId);
	console.debug("sfdc__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts?where=Id=\''+ accountId + '\'';
	
	console.debug("sfdc__getAccountNameById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();                                                            
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.debug("sfdc__getAccountNameById: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
				console.debug("sfdc__getAccountNameById: length == <" + resp.length + ">");
				if (resp.length > 0) {
					console.debug("sfdc__getAccountNameById: resp.Name == <" + resp[0].Name + ">");
					var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].Name + '"}';
					callback(results, str, rownum, 1);
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.error("sfdc__getAccountNameById: xhr.responseText = " + xhr.responseText);
				console.error("sfdc__getAccountNameById: xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// the First Contact Result Callback 
function sfdc__getAccountForContactResults(results, callback) {
	var acctCount = results.length;
	console.log("sfdc__getAccountForContactResults == " + JSON.stringify(results));
	console.log("sfdc__getAccountForContactResults == " + acctCount);
	
	for ( var i = 0; i <= (results.length - 1);  i++) {
		var acct = results[i].AccountId
		console.log("sfdc__getAccountForContactResults == " + acct + " i " + i + " length " + results.length);
		sfdc__getAccountNameById(acct, i, results, sfdc__dispatchAccountForContactResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function sfdc__dispatchAccountForContactResults(contacts, acctdata, iteration, retcount) {
	acctCount += retcount; 
	console.debug("sfdc__dispatchAccountForContactResults == " + acctCount);
	console.debug("sfdc__dispatchAccountForContactResults == " + JSON.stringify(contacts));
	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}
	
	if (acctCount == contacts.length) {
		//acctResult = '[' + acctResult + ']';
		
		sfdc__dispatchContentByAccountId(contacts, JSON.parse('[' + acctResult + ']'), sfdc__getContentByAccountId); // Activities
		sfdc__handleCallResults('incident', contacts, JSON.parse('[' + acctResult + ']'));
	}	
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__handleCallResults(type, contacts, accounts) {
console.log("sfdc__handleCallResults == " + type);
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
function sfdc__dispatchContentByAccountId(contacts, accounts, callback) {
	
	console.debug("sfdc__dispatchContentByAccountId == " + JSON.stringify(contacts));
	console.debug("sfdc__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.debug("sfdc__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;
	 	
	 if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("sfdc__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = 'AccountId=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR AccountId=\'' +  accounts[i].accountId + '\'';
			}
			console.debug("sfdc__dispatchContentByAccountId == AccountId " + accounts.length);
		}
	} else if (accounts.length == 1){
		uri += 'AccountId=\''+  accounts[0].accountId + '\'';
		console.log("sfdc__dispatchContentByAccountId == only 1 " + uri);
	}
	
	console.debug("sfdc__dispatchContentByAccountId == url " + uri );
	sfdc__getContentByAccountId(contacts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__getContentByAccountId(contacts, uri) {
	console.log("\n" +lc.getContentPrimary() + "\nsfdc__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	
	if (lc.getContentPrimary() == 'activities') {
		url += '/activities?where=' + uri;
	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/opportunities?where=' + uri;
	}
	
	console.debug(lc.getContentPrimary() + "sfdc__getContentByAccountId == " + uri);
	console.debug(lc.getContentPrimary() + "sfdc__getContentByAccountId == " + url);
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
    			console.log("sfdc__getContentByAccountId == " + JSON.stringify(resp, null, 2));
    			if (resp.length > 0) {
    				if (lc.getContentPrimary() == 'activities') {
    					sfdc__dispatchNameForActivity(contacts, resp, sfdc__handleContentResults);
    				} else {
    					sfdc__handleContentResults(resp);
    				}
    			}
			} else { 
				console.error("xhr.responseText = " + xhr.responseText);
				console.error("xhr.status = " + xhr.status); 
			}
		}
    }  
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__dispatchNameForActivity(contacts, content, sfdc__handleContentResults) { 
	var uri;
	console.debug('sfdc__dispatchNameForActivity contacts = ' + contacts.length);
	console.debug('sfdc__dispatchNameForActivity content = ' + content.length);
	if (content.length == 0) {
		sfdc__buildNameDict(contacts, content, sfdc__handleContentResults)
	} else {
		console.debug('sfdc__dispatchNameForActivity results = ' + JSON.stringify(content, null, 2))
		console.debug('sfdc__dispatchNameForActivity results = ' + content.length);
		for ( var i = 0; i <= (content.length - 1 );  i++) {
			console.log('sfdc__dispatchNameForActivity == ' + i + " " + content[i].WhoId);
			if (content[i].WhoId && content[i].WhoId != 'undefined') {
				if (i == 0) {
					uri = 'Id=\'' + content[i].WhoId + '\'';
				} else {
					uri += ' OR Id=\'' + content[i].WhoId + '\'';
				}
			}
		}
		console.debug('sfdc__dispatchNameForActivity url = ' + uri)
		sfdc__getContactByIds(uri, content, sfdc__handleContentResults);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__getContactByIds(uri, content, sfdc__handleContentResults) {
	
	var callerId = bg.getRawCallId();
	var clid = callerId.substring(2);
	var fmtCallId = bg.getFormattedCallID();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url +='/contacts?where=' + uri;
	var header = lc.getCloudElementsId();

	 console.debug("sfdc__getContactByIds: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.debug("sfdc__getContactByIds: " + results.length);
    			if (results.length <= 0) {
    				console.debug("sfdc__getContactByIds: ");
    			} else {
    				console.debug("sfdc__getContactByIds: " + JSON.stringify(results, null, 2));
    				sfdc__buildNameDict(results, content, sfdc__handleContentResults)
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
function sfdc__buildNameDict(results, content, sfdc__handleContentResults ) { 
	console.log('sfdc__buildNameDict results = ' + results.length);
	for ( var i = 0; i <= (results.length - 1 );  i++) {
		nameDict[results[i].Id] = results[i].Name; 
	}
	console.log('sfdc__buildNameDict url = ' + JSON.stringify(nameDict, null, 2));
	sfdc__handleContentResults(content);
}

////////////////////////////////////////////////////////////////////////////////////////
function sfdc__handleContentResults(content) {
	
	var contentUrl;
	var rowCount = content.length;
	console.log("sfdc__handleContentResults: rowCount == " + rowCount);
		var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
console.log('sfdc__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));	
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
	    		var c3;
	    		if ( lc.getCrmType() == "Custom" && bg.getCrmJSPackage() == 'FocusVision') {
   					c3 = '<th id="content-head-3" class="contacts-table">Value</th>';
   				} else {
   					c3 = '<th id="content-head-3" class="contacts-table">MRR</th>';
   				}
	    
	    		theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Stage</th>',
   				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Name</th>',
   				"cell_3"   : 	c3,
   				
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
			console.log("sfdc__handleContentResults: WhoId == " + content[i].WhoId + "name == " + nameDict[content[i].WhoId]);		
			var col1 = content[i].Type || 'Not Defined';    			// Type			// 
			var col2 = nameDict[content[i].WhoId];						// Name ,-- Get the contact names
			var col3 = content[i].Subject;								// Subject
			var col4 = date.slice(1, 10); 								//Date	
			
		} else if (lc.getContentPrimary() == 'opportunities') {
			var col1 = content[i].StageName || 'Not Defined';  			//Stage
			var col2 = content[i].Name;	
			if ( lc.getCrmType() == "Custom" && bg.getCrmJSPackage() == 'FocusVision') {								//Name
				var col3 = content[i].Net_Calculated__c || '0';
			} else {
				var col3 = content[i].Amount || '0';
			}
			
			var col4 = content[i].CloseDate;							//Close Date
			var id = content[i].Id;
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
//callback sfdc__getAccountByPhone
function sfdc__getAccountByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	
console.log("sfdc__getAccountByPhone == " + json);

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
				console.log("sfdc__getAccountByPhone == " + xhr.status)
				console.log("sfdc__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					bg.setAcctConnectorID(resp[0].Id);
					callback(resp, sfdc__dispatchContactForAccountResults)
				} else {
				
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
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
function sfdc__buildAccountListForGetContactByAccountId(accounts) {
console.log("sfdc__dispatchContactForAccountResults == " + JSON.stringify(accounts));	
	
	var jsonString;
	
	for ( var i = 0; i <= (accounts.length - 1);  i++) {
		if (i == 0) {
			jsonString = '{"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		} else {
			jsonString += ', {"resultrow": "'+ i + '", "accountId": "' + accounts[i].Id + '", "accountName": "' + accounts[i].Name + '"}';
		}
	}
	
	jsonString = '[' + jsonString + ']';
	console.log("sfdc__dispatchContactForAccountResults == " + JSON.stringify(jsonString));	
	sfdc__dispatchContactForAccountResults(JSON.parse(jsonString), sfdc__getContactByAccountId)			
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__dispatchContactForAccountResults(accountData, callback) {
	console.log("sfdc__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.log("sfdc__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=AccountId=\'';

	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("sfdc__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].accountId + '\'';
	
			} else {
				url += encodeURIComponent(' OR AccountId=\'' +  accountData[i].accountId + '\'');
			}
			console.log("sfdc__dispatchContactForAccountResults == AccountId " + results.length);
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].accountId + '\'';
		console.log("sfdc__dispatchContactForAccountResults == only 1 " + url);
	}
	console.log("sfdc__dispatchContactForAccountResults ==  " + url);
	sfdc__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function sfdc__getContactByAccountId(accounts, url) { //, callback) {
	console.log("sfdc__getContactByAccountId: == " + JSON.stringify(accounts));	
	
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
    			console.log("sfdc__getContactByAccountId: results.length == " + results.length);
    			console.log("\n\n");
    	
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				console.log("sfdc__getContactByAccountId: ");
    			} else {
    			  	sfdc__dispatchContentByAccountId(results, accounts, sfdc__getContentByAccountId);
    				sfdc__handleContactsByAccountById('any', results, accounts);//, sfdc__dispatchContactForAccountResults)
    			} 
      		} else if ( xhr.status == 401 ){ 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
      		} else { 
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status);
    		}
      	}  
  		
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
function sfdc__handleContactsByAccountById(type, contacts, accounts) {
	console.log("sfdc__handleContactsByAccountById: type == " + type);
	console.log("sfdc__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));
	acctdict = {}
	accounts.forEach(function(accounts) {
    		acctdict[accounts.accountId] = accounts.accountName
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
		var name = contacts[i].Name; 
		nameDict[contacts[i].Id] = contacts[i].Name;
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = acctdict[contacts[i].AccountId];
		
    	 jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">New...</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    
   
    if (rowCount == 1) {
		
		bg.setContactLeadId(json[i].id); 
		var new_window = window.open(url, 'Contact ' + name);
		new_window.focus();
		
	} else  if (rowCount > 1) {
		console.log('sfdc__handleCallResults: tblstr ' + jsonString);
		console.log('sfdc__handleCallResults: tblstr ' + JSON.stringify(jsonString));
		bg.setAnchorTableData(JSON.stringify(jsonString));
		
	}
	bg.setAnchorTableData(JSON.stringify(jsonString));
} 
