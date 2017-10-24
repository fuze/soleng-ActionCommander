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
exports.usauto__sfdc__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);


	console.log("usauto__sfdc__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("usauto__sfdc__callHandler: "+ callState +" Caller ID == " + json.direction);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		//usauto__sfdc__getContactByPhone(json);//, usauto__sfdc__getAccountForContactResults);
		usauto__sfdc__getAccountByPhone(json, usauto__usauto__sfdc__getSalesUpForContacts);
	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("usauto__sfdc__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};

///////////////////////////////////////////////////////////////
function usauto__sfdc__Validate(callback) {

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    url += '/ping';
	var header = lc.getCloudElementsId();
	console.log("usauto__sfdc__Validate: " + url);
	console.log("usauto__sfdc__Validate: " + header);
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization",  header ); 
    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    			console.log("usauto__sfdc__Validate: resp.success == " + xhr.responseText)
    			var resp = JSON.parse( xhr.responseText );
    			if ( typeof resp.endpoint == 'string' ) { 
    				console.log("usauto__sfdc__Validate: User Validated ");
    				bg.setCrmAuthStatus(true);
    			}
      		} else { 
      			bg.setCrmAuthStatus(false);
      			console.log("xhr.responseText = " + xhr.responseText);
    			console.log("xhr.status = " + xhr.status); 
    			alert("usauto__sfdc__Validate: Invalid CRM User" + xhr.responseText);
    			return false;
      		}
      	}  
  	}; 
	xhr.send(null);
	return true;
}

////////////////////////////////////////////////////////////////////////////////////////
// @ callback == usauto__usauto__sfdc__getSalesUpForContacts
////////////////////////////////////////////////////////////////////////////////////////
function usauto__sfdc__getAccountByPhone(json, callback) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	
console.log("usauto__sfdc__getAccountByPhone == " + json);

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
				console.log("usauto__sfdc__getAccountByPhone == " + xhr.status)
				console.log("usauto__sfdc__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, usauto__sfdc__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					bg.setCallerName(resp[0].Name);
					usauto__sfdc__handleCallResults(resp);
					usauto__usauto__sfdc__getSalesUpForContacts(resp);//, usauto__sfdc__dispatchContactForAccountResults)
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
////////////////////////////////////////////////////////////////////////////////////////
function usauto__usauto__sfdc__getSalesUpForContacts(list) {

console.log("usauto__usauto__sfdc__getSalesUpForContacts == " + JSON.stringify(list, null,2));
	var dealerContact = list[0].PersonContactId;
	var customerId = list[0].Id;
		
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url +='/dealer__Sales_Up__c?where=(dealer__Customer_Account__c=\''+ customerId + '\' or dealer__Buyer_Contact__c=\'' + dealerContact + '\')';

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;                                                                  
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header ); 
	xhr.setRequestHeader("cache-control", "no-cache"); 
	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) { 
				console.log("usauto__usauto__sfdc__getSalesUpForContacts == " + xhr.status)
				console.log("usauto__usauto__sfdc__getSalesUpForContacts == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, usauto__sfdc__getContactByAccountId); //, str, rownum, 1);
				if ((resp[0] !== undefined) || (resp.length > 0)) {
					usauto__sfdc__handleContentResults(resp);
				} else {
					// Look for a Users ....
					
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					//bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
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
function usauto__sfdc__handleCallResults(contacts) {
console.log("usauto__sfdc__handleCallResults == " + JSON.stringify(contacts, null, 2));
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
        	"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Owner</td>',
       		"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
       		"rowend"   : 	'</tr>'
	    });
	}
	
	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		var name = contacts[i].Name
		var id = contacts[i].Id;
		var userUrl = lc.getCrmBaseUrl() + '/' + id;
		var acctname = contacts[i].AccountOwnerName__c;
		var ownerId = contacts[i].OwnerId;
    	 achorString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="contacts" uid="'+ id + '" class="contacts-table-name">' + name + '</td>',
        	"cell_2"   : 	'<td action="openwindow" type="accounts" acctid="' + ownerId +'" >' + acctname + '</td>',
       		"cell_3"   : 	'<td action="create" type="' + lc.getContentPrimary()+ '"  uid="'+ id + '" acctid="' + ownerId +'">' + bg.getCreateNewString() + '</td>',
       		"rowend"   : 	'</tr>'
    	});
    }
    bg.setAnchorTheadData(JSON.stringify(anchorHead));
    bg.setAnchorTableData(JSON.stringify(achorString));
}

////////////////////////////////////////////////////////////////////////////////////////
function usauto__sfdc__handleContentResults(content) {
	
	
	var contentUrl;
	var rowCount = content.length;
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();
	console.log('usauto__sfdc__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));	
	console.log('usauto__sfdc__handleContentResults Content  == ' + JSON.stringify(content, null, 2));	
	if (rowCount) {
		
		theadJson.dataRows.push({
    		"rowstart" : 	'<thread><tr id="remove-' + (rowCount + 1) + '">',
			"cell_1"   : 	'<th id="content-head-1" class="activities-table">Type</th>',
       		"cell_2"   : 	'<th id="content-head-2" class="activities-table">Status</th>',
    		"cell_3"   : 	'<th id="content-head-3" class="activities-table">Catagory</th>',
       		"rowend"   : 	'</tr></thread>'
	    });
	    
	}
	
	for ( var i = 0; i <= (content.length - 1);  i++) {
		
		var col1 = content[i].dealer__Lead_Type__c  || 'Not Defined';  			//Stage
		var col2 = content[i].dealer__Lead_Status__c;									//Name
		var col3 = content[i].StatusCategory__c || 'Not Defined';		//MRR
		var id = content[i].Id;
		var acctId = content[i].CustomerAccountID__c;

	
		
		if (i >= 0) {
		 	contentJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + i + '">',
				"cell_1"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="activities-table-name">' + col1 + '</td>',
       			"cell_2"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="activities-table-name">' + col2 + '</td>',
       			"cell_3"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="activities-table-name">' + col3 + '</td>',
       			"rowend"   : 	'</tr>'
    		});
    	}

    }
	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentJson));
} 
////////////////////////////////////////////////////////////////////////////////////////
//callback usauto__sfdc__getAccountByPhone

/*
If Getting User is successful display
If not successful display No Match and prompt for new user and Opportunit/activity/ticket creation.
then create the contact (pop screen) and Create Ticket (pop screen)
*/
////////////////////////////////////////////////////////////////////////////////////////
