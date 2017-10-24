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


var accounts = []; 	
var contacts = []; 	
var content = []; 	
var contentDict = [];	
var nameDict = {};	
var acctDict = {};	
	
///////////////////////////////////////////////////////////////
exports.epsilon__sfdc__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);


	console.log("epsilon__sfdc__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("epsilon__sfdc__callHandler: "+ callState +" Caller ID == " + json.direction);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		epsilon__sfdc__getContactByPhone(json, epsilon__sfdc__getAccountForContactResults);
		
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("epsilon__sfdc__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
		
		accounts = [];
		contacts = [];
		content = [];
		contentDict = [];
		nameDict = {};
		acctDict = {};
	}

};
///////////////////////////////////////////////////////////////
function epsilon__sfdc__Validate(callback) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/ping';
	var header = lc.getCloudElementsId();
	console.log("epsilon__sfdc__Validate: " + url);
	console.log("epsilon__sfdc__Validate: " + header);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			console.log("epsilon__sfdc__Validate: resp.success == " + xhr.responseText)
    			var resp = JSON.parse( xhr.responseText );
    			if ( typeof resp.endpoint == 'string' ) { 
    				console.log("epsilon__sfdc__Validate: User Validated ");
    				bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("epsilon__sfdc__Validate: Invalid CRM User" + xhr.responseText);
    			return false;
      		}
      	}  
  	}; 
	xhr.send(null);
	return true;
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__getContactByPhone(json, callback) {
console.log("epsilon__sfdc__getContactByPhone:"); 
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
		url +='/contacts?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\'';
		url +=' or MobilePhone like \'%25' + internationalNumber + '\' or MobilePhone like \'%25' +  internationalRawNumber + '\' or MobilePhone=\'' +  nationalNumber + '\' or MobilePhone=\'' +  nationalRawNumber + '\'';
		url +=' or OtherPhone like \'%25' + internationalNumber + '\' or OtherPhone like \'%25' +  internationalRawNumber + '\' or OtherPhone=\'' +  nationalNumber + '\' or OtherPhone=\'' +  nationalRawNumber + '\')';

	console.debug("epsilon__sfdc__getContactByPhone: url == " + url); 

	
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
    				//bg.setContactRole('No Match Found');
					console.info('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
    				console.info("epsilon__sfdc__getContactByPhone: <= 0");
    				epsilon__sfdc__getAccountByPhone(json, epsilon__sfdc__dispatchContactForAccountResults); 
    			} else {
    				bg.setCallerName(results[0].Name);
    				console.info("epsilon__sfdc__getContactByPhone: Name == " + results[0].Name); 
    				bg.setContactRole(results[0].Title);
    				
    				console.info("epsilon__sfdc__getContactByPhone result.length " + results.length + " " + i );
    			    for (var i = 0; i <= results.length -1; i++) {
    			    	console.info("epsilon__sfdc__getContactByPhone results[i] " + " " + i + " " + results[i]);
    			    	contacts.push(results[i]);
    			    }
    			    epsilon__sfdc__buildNameDict(results);		
    			    epsilon__sfdc__getAccountForContactResults(results); //, epsilon__sfdc__dispatchAccountForContactResults);
    			    
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
// the First Contact Result Callback 
function epsilon__sfdc__getAccountForContactResults(contacts) {
console.info("epsilon__sfdc__getAccountForContactResults");
	console.info("epsilon__sfdc__getAccountForContactResults ==  length " + contacts.length);
	var uri;
	for ( var i = 0; i <= (contacts.length - 1 );  i++) {
		console.log('epsilon__sfdc__getAccountForContactResults == ' + i + " " + contacts[i].AccountId);
		if (i == 0) {
			uri = 'Id%3D\''+ contacts[i].AccountId + '\'';
		} else {
			uri += ' OR Id%3D\'' +  contacts[i].AccountId + '\'';
		}
	}
	console.log('epsilon__sfdc__getAccountForContactResults url = ' + uri)
	epsilon__sfdc__getAccountById(contacts, uri);
	
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__getAccountById(contacts, uri) {
console.info("epsilon__sfdc__getAccountById == " + uri);

	var header = lc.getCloudElementsId();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/accounts_epsilon?where=' + uri;
	
	console.info("epsilon__sfdc__getAccountById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();                                                               
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				var responseText = xhr.responseText;
				var resp = JSON.parse(responseText);
				if (!(resp instanceof Array)) { 
					responseText = '[' + responseText +']';
					resp = JSON.parse(responseText);
				}
				
				if (resp.length > 0) {
					console.info("epsilon__sfdc__getAccountById: length == <" + resp.length + ">");
					
					for (var i = 0; i <= resp.length -1; i++) {
						console.info("epsilon__sfdc__getAccountById: accounts.length == <" + accounts.length + ">");
    			    	accounts.push(resp[i]);
    			    }
    			    	
    			    epsilon__sfdc__buildAcctDict(resp);	
					console.info("epsilon__sfdc__getAccountById: length == <" + JSON.stringify(accounts) + ">");
					epsilon__sfdc__mainDispatcher(contacts, resp);	
					
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.log("epsilon__sfdc__getAccountNameById: xhr.responseText = " + xhr.responseText);
				console.log("epsilon__sfdc__getAccountNameById: xhr.status = " + xhr.status); 
			}
		}  
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
// Main Dispatcher 
function epsilon__sfdc__mainDispatcher(contacts, accounts) {
console.info("epsilon__sfdc__mainDispatcher == ");
	console.info("epsilon__sfdc__mainDispatcher: JSON.stringify of CONTACTS == <\n\n\n\n" +JSON.stringify(contacts) + "\n>");	
	console.info("epsilon__sfdc__mainDispatcher: length == CONTACTS <" + contacts.length + ">");
	epsilon__sfdc__buildNameDict(contacts);
	epsilon__sfdc__buildAcctDict(accounts);
	console.info("epsilon__sfdc__mainDispatcher: JSON.stringify of ACCOUNTS == <\n\n\n\n" +JSON.stringify(accounts) + "\n>");	
	console.info("epsilon__sfdc__mainDispatcher: length ACCOUNTS == <" + accounts.length + ">");

	
	epsilon__sfdc__handleCallResults(contacts, accounts);
	epsilon__sfdc__dispatchContentByAccountId(contacts, accounts, epsilon__sfdc__getContentByAccountId);
	
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__buildNameDict(contacts) { 
	console.info('epsilon__sfdc__buildNameDict results = ' + contacts.length);
	for ( var i = 0; i <= (contacts.length - 1 );  i++) {
		nameDict[contacts[i].Id] = contacts[i].Name; 
	}
	console.info('epsilon__sfdc__buildNameDict url = ' + JSON.stringify(nameDict, null, 2));
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__buildAcctDict(accounts) { 
	console.info('epsilon__sfdc__buildAcctDict results = ' + accounts.length);
	for ( var i = 0; i <= (accounts.length - 1 );  i++) {
		console.info('epsilon__sfdc__buildAcctDict results = ' + i + ' name == ' + accounts[i].Name + 'ID == ' + accounts[i].Id);	
		acctDict[accounts[i].Id] = accounts[i].Name; 
	}
	console.info('epsilon__sfdc__buildAcctDict url = ' + JSON.stringify(acctDict, null, 2));
}
////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback 
function epsilon__sfdc__dispatchContentByAccountId(contacts, accounts, callback) {
console.info('epsilon__sfdc__dispatchContentByAccountId results = ');
	console.info("epsilon__sfdc__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.info("epsilon__sfdc__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;
	 	
	 if (contacts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.info("epsilon__sfdc__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = 'AccountId=\''+ accounts[i].Id + '\'';
			} else {
				uri += ' OR AccountId=\'' +  accounts[i].Id + '\'';
			}
			console.info("epsilon__sfdc__dispatchContentByAccountId == AccountId " + accounts.length);
		}
	} else if (accounts.length == 1){
		uri += 'AccountId=\''+  accounts[0].Id + '\'';
		console.debug("epsilon__sfdc__dispatchContentByAccountId == only 1 " + uri);
	}
	
	console.info("epsilon__sfdc__dispatchContentByAccountId == url " + uri );
	epsilon__sfdc__getContentByAccountId(contacts, accounts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__getContentByAccountId(contacts, accounts, uri) {
	console.info(lc.getContentPrimary() + " epsilon__sfdc__getContentByAccountId == " + uri);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	
	if (lc.getContentPrimary() == 'activities') {
		url += '/activities?where=' + uri;
	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/opportunities?where=' + uri;
	} else if (lc.getContentPrimary() == 'tasks') {
		url += '/tasks?where=Completed__c = 0 and ' + uri ;
		// tasks by contact id https://console.cloud-elements.com/elements/api-v2/hubs/crm/contacts/0034000000mX8fYAAS/tasks
	}
	
	console.info(lc.getContentPrimary() + " epsilon__sfdc__getContentByAccountId == " + uri);
	console.info(lc.getContentPrimary() + " epsilon__sfdc__getContentByAccountId == " + url);
	var header = lc.getCloudElementsId();
	
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.debug("epsilon__sfdc__getContentByAccountId == " + xhr.status)
				console.debug("epsilon__sfdc__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
    			console.debug("epsilon__sfdc__getContentByAccountId == " + uri);
    			console.info("epsilon__sfdc__getContentByAccountId == " + JSON.stringify(resp, null, 2));
    			if (resp.length > 0) {
    				for (var i = 0; i <= resp.length -1; i++) {
    			    	//if (contentDict.includes(resp[i].Id)) {
    			    	content.push(resp[i]);
    			    	//}
    			    }
    			   
    				//if ((lc.getContentPrimary() == 'activities') || (lc.getContentPrimary() == 'opportunities')) {
    				if ((lc.getContentPrimary() == 'activities') || (lc.getContentPrimary() == 'tasks')) {
    					epsilon__sfdc__dispatchNameForActivity(contacts, accounts, content, epsilon__sfdc__dispatchContentByContactId);
    				} else {
    					epsilon__sfdc__handleContentResults(resp);
    				}
    			}
    			bg.setCrmAuthStatus(true);
			} else { 
				console.debug("xhr.responseText = " + xhr.responseText);
				console.debug("xhr.status = " + xhr.status); 
			}
		}
    }  
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__dispatchNameForActivity(contacts, accounts, content, callback) { 
	var uri; var whoid = [];
	console.info('epsilon__sfdc__dispatchNameForActivity contacts = ' + contacts.length);
	console.info('epsilon__sfdc__dispatchNameForActivity content = ' + content.length);
	console.info('epsilon__sfdc__dispatchNameForActivity content = ' + JSON.stringify(content));
	if (content.length == 0) {
		//epsilon__sfdc__buildNameDict(contacts, content, epsilon__sfdc__handleContentResults)
		epsilon__sfdc__buildNameDict(contacts);
	} else {
		console.debug('epsilon__sfdc__dispatchNameForActivity results = ' + JSON.stringify(content, null, 2))
		console.debug('epsilon__sfdc__dispatchNameForActivity results = ' + content.length);
		for ( var i = 0; i <= (content.length - 1 );  i++) {
			console.info('epsilon__sfdc__dispatchNameForActivity == ' + i + " <" + content[i].WhoId + ">");
			console.info('epsilon__sfdc__dispatchNameForActivity == '  + i +" <" + typeof content[i].WhoId + "> <" + content[i].WhoId + ">");
			if (content[i].hasOwnProperty('WhoId')) {
				whoid.push(content[i].WhoId);
			}
		}
		for (var j = 0; j <= whoid.length - 1; j++) {
    		if (j == 0) {
				uri = 'Id=\''+ whoid[j] + '\'';
			} else {
				uri += ' OR Id=\'' +  whoid[j] + '\'';
			}
		}
		
		console.info('epsilon__sfdc__dispatchNameForActivity whoid = ' + whoid.length)
		console.info('epsilon__sfdc__dispatchNameForActivity url = ' + uri)
		epsilon__sfdc__getContactByIds(uri, content, contacts, accounts, callback);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__getContactByIds(uri, content, contacts, accounts, callback) {
console.info('epsilon__sfdc__getContactByIds uri = ' + uri);	
	var callerId = bg.getRawCallId();
	var clid = callerId.substring(2);
	var fmtCallId = bg.getFormattedCallID();
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url +='/contacts?where=' + uri;
	var header = lc.getCloudElementsId();

	console.info("epsilon__sfdc__getContactByIds: url == " + url);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
    			console.debug("epsilon__sfdc__getContactByIds: " + results.length);
    			if (results.length <= 0) {
    				console.info("epsilon__sfdc__getContactByIds: ");
    			} else {
    				console.info("epsilon__sfdc__getContactByIds: " + JSON.stringify(results, null, 2));
    				epsilon__sfdc__dispatchContentByContactId(contacts, accounts, results);
    				console.info("epsilon__sfdc__getContactByIds: " + JSON.stringify(contacts, null, 2));
    			    bg.setCrmAuthStatus(true);
    			} 
      		} else { 
      	
      			console.debug("xhr.responseText = " + xhr.responseText);
    			console.debug("xhr.status = " + xhr.status); 
      		}
      	}  
  		
	}
	xhr.send(null);
}
////////////////////////////////////////////////////////////////////////////////////////
////////
////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback 
function epsilon__sfdc__dispatchContentByContactId(contacts, accounts, results) {
	var count = contacts.length;
	console.info('epsilon__sfdc__dispatchContentByContactId  = ' + count);	
	
	for ( var i = 0; i <= count - 1;  i++) {
		var contact = contacts[i].Id;
		if( i < count -1 ) {
			console.info("epsilon__sfdc__dispatchContentByContactId == " + contact + " i " + i + " length " + contacts.length);
			epsilon__sfdc__getContentByContactId(contact, null);
		} else { 
			console.info("epsilon__sfdc__dispatchContentByContactId == " + contact + " i " + i + " length " + contacts.length);
			epsilon__sfdc__getContentByContactId(contact, null);
		}
	} 	
	epsilon__sfdc__buildNameDict(results);
}


////////////////////////////////////////////////////////////////////////////////////////
//function epsilon__sfdc__getContentByContactId(contact, accounts, uri) {
function epsilon__sfdc__getContentByContactId(contact) {

	console.info("epsilon__sfdc__getContentByContactId == " + contact);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	
	if (lc.getContentPrimary() == 'activities') {
		url += '/contants/' + contact + '/activities';
	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/contants/' + contact + '/opportunities';
	} else if (lc.getContentPrimary() == 'tasks') {
		url += '/contacts/' + contact + '/tasks?where=Completed__c = 0';
		
	}
	
	console.info(lc.getContentPrimary() + " epsilon__sfdc__getContentByContactId == " + url);
	var header = lc.getCloudElementsId();
	
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache"); 
    xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.debug("epsilon__sfdc__getContentByContactId == " + xhr.status)
				console.debug("epsilon__sfdc__getContentByContactId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
    			console.debug("epsilon__sfdc__getContentByContactId == " + JSON.stringify(resp, null, 2));
    			if (resp.length > 0) {
    				console.info("epsilon__sfdc__getContentByContactId == " + content.length);
    				console.info("epsilon__sfdc__getContentByContactId == " + resp.length);
    				//console.info("epsilon__sfdc__getContentByContactId == " + JSON.stringify(content));
    				for (var i = 0; i <= resp.length -1; i++) {
    			    	if (contentDict.includes(resp[i].Id)) {
    			    		content.push(resp[i]);
    			    	}
    			    		
    			    }
    			    console.debug("epsilon__sfdc__getContentByContactId == " + content.lenght);
    			    console.debug("epsilon__sfdc__getContentByContactId == " + JSON.stringify(nameDict));	
    			    epsilon__sfdc__handleContentResults(content);
    				//if ((lc.getContentPrimary() == 'activities') || (lc.getContentPrimary() == 'opportunities')) {
    				if ((lc.getContentPrimary() == 'activities') || (lc.getContentPrimary() == 'tasks')) {
    				//	epsilon__sfdc__dispatchNameForActivity(contacts, accouts, content, epsilon__sfdc__dispatchContentByAccountId);
    				} else {
    				// epsilon__sfdc__handleContentResults(content);
    				}
    			}
    			bg.setCrmAuthStatus(true);
			} else { 
				console.debug("xhr.responseText = " + xhr.responseText);
				console.debug("xhr.status = " + xhr.status); 
			}
		}
    }  
	xhr.send(null);
}

///////////
// This is for accounts
//
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
//callback epsilon__sfdc__getAccountByPhone
function epsilon__sfdc__getAccountByPhone(json, epsilon__sfdc__dispatchContactForAccountResults) {

	console.info("epsilon__sfdc__getAccountByPhone == " + JSON.stringify(json));

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);

	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/accounts_epsilon?where=(Phone like \'%25' + internationalNumber + '\' or Phone like \'%25' +  internationalRawNumber + '\' or Phone=\'' +  nationalNumber + '\' or Phone=\'' +  nationalRawNumber + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.debug("epsilon__sfdc__getAccountByPhone == " + xhr.status)
				console.debug("epsilon__sfdc__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
			console.info("epsilon__sfdc__getAccountByPhone == " + JSON.stringify(resp));
				//  HANDLE NO RESULTS !!!!
				//callback(resp, epsilon__sfdc__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					bg.setCallerName(resp[0].Name);
					epsilon__sfdc__buildAcctDict(resp);	
					epsilon__sfdc__dispatchContactForAccountResults(resp); //, epsilon__sfdc__dispatchContactForAccountResults)
				} else {
					// Look for a Users ....
					bg.setContactRole('No Match Found');
					console.debug('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else { 
				console.debug("xhr.responseText = " + xhr.responseText);
				console.debug("xhr.status = " + xhr.status); 
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
function epsilon__sfdc__dispatchContactForAccountResults(accountData, callback) {
	console.debug("\n\epsilon__sfdc__dispatchContactForAccountResults == " + JSON.stringify(accountData));
	console.debug("\n\epsilon__sfdc__dispatchContactForAccountResults == length " + accountData.length);
	
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	 	url += '/contacts?where=AccountId=\'';
		// Lets' make sure we don't have duplicate account ID.
	 if (accountData.length >= 1) {
		for ( var i = 0; i <= (accountData.length - 1);  i++) {
			console.log("epsilon__sfdc__dispatchContactForAccountResults == in for loop AccountId " + accountData.length);
			if (i == 0) {
				url += accountData[i].Id + '\'';
	
			} else {
				url += encodeURIComponent(' OR AccountId=\'' +  accountData[i].Id + '\'');
			}
			console.info("epsilon__sfdc__dispatchContactForAccountResults == AccountId " + accountData.length);
		}
	} else if (accountData.length == 1){
		url +=  accountData[0].Id + '\'';
		console.info("epsilon__sfdc__dispatchContactForAccountResults == only 1 " + url);
	}
	console.debug("epsilon__sfdc__dispatchContactForAccountResults ==  " + url);
	epsilon__sfdc__getContactByAccountId(accountData, url)
}
////////////////////////////////////////////////////////////////////////////////////////
//callback 
function epsilon__sfdc__getContactByAccountId(accounts, url) { //, callback) {
	console.debug("epsilon__sfdc__getContactByAccountId: == " + JSON.stringify(accounts));	
	
	var header = lc.getCloudElementsId();

	console.debug("epsilon__sfdc__getContactByAccountId: url == " + url); 
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			var results = JSON.parse( xhr.responseText );
				console.debug("epsilon__sfdc__getContactByAccountId: results.length == " + results.length);
    			// What if there are no results  look at accounts.
    			if (results.length <= 0) {
    				console.debug("epsilon__sfdc__getContactByAccountId: ");
    				
    				bg.setCrmAuthStatus(true);
    			} else {
    				epsilon__sfdc__buildNameDict(results);
    			  	epsilon__sfdc__dispatchContentByAccountId(results, accounts, epsilon__sfdc__getContentByAccountId);
    				//epsilon__sfdc__handleContactsByAccountById('any', results, accounts);//, epsilon__sfdc__dispatchContactForAccountResults)
    				epsilon__sfdc__handleCallResults(results, accounts);
    			    bg.setCrmAuthStatus(true);
    			    return true;
    			} 
      		} else if ( xhr.status == 401 ){ 
      			//bg.setCrmAuthStatus(false);
      			console.debug("CRM Unauthorized Access");
      			alert("CRM Unauthorized Access");
      			console.debug("xhr.responseText = " + xhr.responseText);
    			console.debug("xhr.status = " + xhr.status); 
    			return false;
      		} else { 
      			console.debug("xhr.responseText = " + xhr.responseText);
    			console.debug("xhr.status = " + xhr.status);
    			return false;
    		}
      	}  
  		
	}
	xhr.send(null);
}


////////////////////////////////////////////////////////////////////////////////////////
// Display Functions
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__handleContactsByAccountById(type, contacts, accounts) {
	console.info("epsilon__sfdc__handleContactsByAccountById: type == " + type);
	console.info("epsilon__sfdc__handleContactsByAccountById: accounts == " + JSON.stringify(accounts));

	accounts.forEach(function(accounts) {
    		acctDict[accounts.accountId] = accounts.Name
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
		var acctname = acctDict[contacts[i].AccountId];
		
    	 jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + acctId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + acctId +'">' + bg.getCreateNewString() + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    
    if (rowCount == 1) {
		
		//bg.setAnchorTableData(JSON.stringify(jsonString));
		
		bg.setContactLeadId(json[i].id); 
		var new_window = window.open(url, 'Contact ' + json[i].id);
		new_window.focus();
		
	} else  if (rowCount > 1) {
		console.debug('epsilon__sfdc__handleCallResults: tblstr ' + jsonString);
		console.debug('epsilon__sfdc__handleCallResults: tblstr ' + JSON.stringify(jsonString));
		bg.setAnchorTableData(JSON.stringify(jsonString));
		
	}
	bg.setAnchorTableData(JSON.stringify(jsonString));
} 
////////////////////////////////////////////////////////////////////////////////////////
function epsilon__sfdc__handleCallResults(contacts, accounts) {
console.info("epsilon__sfdc__handleCallResults == ");
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
		
		//var name = contacts[i].Name
		var acctId = contacts[i].AccountId;
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		//var acctname = accounts[i].Name;
		var acctname = acctDict[acctId];
		var name = nameDict[id];
		
		//nameDict[id] = name;
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
function epsilon__sfdc__handleContentResults(content) {
	
	var contentUrl;
	var rowCount = content.length;
	console.info("epsilon__sfdc__handleContentResults: rowCount == " + rowCount);
		var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	console.info('epsilon__sfdc__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));	
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
	      } else if (lc.getContentPrimary() == 'tasks') {
	    		theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Subject</th>',
   				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Name</th>',
   				 "cell_3"   : 	'<th id="content-head-3" class="contacts-table">Priority</th>',
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
			console.info("epsilon__sfdc__handleContentResults: WhoId == " + content[i].WhoId + "name == " + nameDict[content[i].WhoId]);		
			var col1 = content[i].Type || 'Not Defined';    			// Type			// 
			var col2 = nameDict[content[i].WhoId];						// Name ,-- Get the contact names
			var col3 = content[i].Subject;								// Subject
			var col4 = date.slice(1, 10); 								//Date	
		} else if (lc.getContentPrimary() == 'tasks') {
			var col1 = content[i].Subject || 'Not Defined';
			var col2 = nameDict[content[i].WhoId] || 'Unknown';  			//Stage
			//var col2 = content[i].WhoId;									//Name
			var col3 = content[i].Priority || 'Not Defined';		//MRR
			var col4 = content[i].Date_Time_Due__c;							//Close Date
			var id = content[i].Id;
		} else if (lc.getContentPrimary() == 'opportunities') {
			var col1 = content[i].StageName || 'Not Defined';  			//Stage
			var col2 = content[i].Name;									//Name
			var col3 = content[i].Amount || 'Not Defined';		//MRR
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
