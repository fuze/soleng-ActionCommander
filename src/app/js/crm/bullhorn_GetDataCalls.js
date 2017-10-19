'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')
const config = pjson.config;

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
exports.bullhorn__callHandler = function(callState, json) {
	bg.setCallDirection(json.direction);


	console.log("bullhorn__callHandler: "+ callState +" Caller ID == " + json.clidname);
	console.log("bullhorn__callHandler: "+ callState +" Caller ID == " + json.direction);
	if ((!_callHandled) && (callState == 'RING' || callState == 'DIAL' || callState == 'CALL_START')) {
		_callHandled = true;
		
		util.setCallData(callState, json);
		bullhorn__getContactByPhone(json);
		bullhorn__getLeadByPhone(json)
		bullhorn__getCandidateByPhone(json, phoneNumberPattern.International);


	} else if (callState == 'CONNECT') {

		bg.setStarttime('mdy');
		bg.setCallState(callState);

	} else if (callState == 'CALL_END') {

		console.log("bullhorn__callHandler: CALL_END Caller ID == " + json.clidname);
		util.setCallData(callState, json);
		uh.utilityActionController('callend', JSON.parse('{"type":"logcall", "endtime" : "' + json.timestamp + '" }'));
		_callHandled = false;
	}

};

////////////////////////////////////////////////////////////////////////////////////////
function bullhorn__getCandidateByPhone(json) {
	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/candidates?where=(phone=\'' +  internationalRawNumber + '\' or phone=\'%2B' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';
	console.log("bullhorn__getCandidateByPhone: url == " + url); 

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
					console.log("bullhorn__getCandidateByPhone: No match")

				} else {
					console.log("bullhorn__getCandidateByPhone: Candidate found!!")

					var personalRef = '"personReference": {'+
						'"firstName": "' + results[0].firstName + '",'+
						'"lastName": "' + results[0].lastName + '",'+
						'"_subtype": "Candidate",'+
						'"id": ' + results[0].id +' '+
						'}';

					bg.setCallerName(results[0].name);
					bg.setContactLeadId(personalRef);

					//bullhorn__getJobSubmissionsForCandidateResults(results);
					bullhorn__handleCallResults("Candidate", results);

					//bullhorn__handleCallResultsForCandidates(results);
					bg.setCrmAuthStatus(true);

					//bullhorn__getContactByPhone(json);

				}
			} else {
				bg.setCrmAuthStatus(false);
				console.log("bullhorn__getCandidateByPhone: xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getCandidateByPhone: xhr.status = " + xhr.status);
			}
		}

	}
	xhr.send(null);
}
///////////////////////////////////////////////////////////////
function bullhorn__getContactByPhone(json) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/contacts?where=( phone=\'' +  internationalRawNumber + '\' or phone=\'%2B' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\' )';
	// or phone=\'%2B' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';
	//url +='or mobile=\'' +  internationalRawNumber + '\' or mobile=\'' +  nationalNumber + '\' or mobile=\'' +  nationalRawNumber + '\')';

	console.log("bullhorn__getContactByPhone: url == " + url);

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
					//bullhorn__getLeadByPhone(json)
					console.log("bullhorn__getContactByPhone: No matches")
				} else {
					console.log("bullhorn__getContactByPhone::Name: " + results[0].name);
					var personalRef = '"personReference": {'+
						'"firstName": "' + results[0].firstName + '",'+
						'"lastName": "' + results[0].lastName + '",'+
						'"_subtype": "ClientContact",'+
						'"id": ' + results[0].id +' '+
						'}';

					bg.setCallerName(results[0].name);
					bg.setContactLeadId(personalRef);

					bullhorn__getAccountForContactResults("Client Contact", results, bullhorn__dispatchAccountForContactResults);

					bg.setCrmAuthStatus(true);
				}

			} else {
				//bg.setCrmAuthStatus(false);
				console.log("bullhorn__getContactByPhone::xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getContactByPhone::xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}
///////////////////////////////////////////////////////////////
function bullhorn__getLeadByPhone(json, candidates, contacts) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/leads?where=(phone=\'' +  internationalNumber + '\' or phone=\'%2B' +  internationalNumber + '\' or phone=\'' +  internationalRawNumber + '\' or phone=\'%2B' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';

	console.log("bullhorn__getLeadByPhone: url == " + url);

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
					//bullhorn__getAccountByPhone(json)
					console.log("bullhorn__getLeadByPhone: No matches");
				} else {
					console.log("bullhorn__getLeadByPhone::Name: " + results[0].name);
					var personalRef = '"personReference": {'+
						'"firstName": "' + results[0].firstName + '",'+
						'"lastName": "' + results[0].lastName + '",'+
						'"_subtype": "ClientContact",'+
						'"id": ' + results[0].id +' '+
						'}';

					bg.setCallerName(results[0].name);
					bg.setContactLeadId(personalRef);

					//bullhorn__getAccountForContactResults("Lead", results, bullhorn__dispatchAccountForContactResults);
					bullhorn__handleCallResults("Lead", results);

					bg.setCrmAuthStatus(true);
				}

			} else {
				//bg.setCrmAuthStatus(false);
				console.log("bullhorn__getLeadByPhone::xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getLeadByPhone::xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);

}
///////////////////////////////////////////////////////////////
function bullhorn__getAccountByPhone(json) {

	var callerId = bg.getRawCallId();
	var internationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.International);
	var internationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.InternationalRaw);
	var nationalNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.National);
	var nationalRawNumber = ph.getPhoneNumberPattern(callerId, phoneNumberPattern.NationalRaw);
	var header = lc.getCloudElementsId();
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	url +='/corporations?where=(phone=\'' + internationalNumber + '\' or phone=\'' +  internationalRawNumber + '\' or phone=\'' +  nationalNumber + '\' or phone=\'' +  nationalRawNumber + '\')';

	console.log("bullhorn__getAccountByPhone: url == " + url);

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("bullhorn__getAccountByPhone == " + xhr.status)
				console.log("bullhorn__getAccountByPhone == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//  HANDLE NO RESULTS !!!!
				//callback(resp, bullhorn__getContactByAccountId); //, str, rownum, 1);
				if (resp[0] !== undefined) {
					//callback(resp, bullhorn__dispatchContactForAccountResults)
				} else {
					bg.setContactRole('No Match Found');
					console.log('No Contact or Account results for ' + bg.getFormattedCallID());
					bg.setCrmAuthMessage('No Contact or Account results for ' + bg.getFormattedCallID());
				}
				bg.setCrmAuthStatus(true);
			} else {
				//bg.setCrmAuthStatus(false);
				console.log("xhr.responseText = " + xhr.responseText);
				console.log("xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}
///////////////////////////////////////////////////////////////
function bullhorn__getAccountForContactResults(type, results, callback) {
	var acctCount = results.length;
	console.log("bullhorn__getAccountForContactResults == " + JSON.stringify(results));
	console.log("bullhorn__getAccountForContactResults == " + acctCount);

	for ( var i = 0; i <= (results.length - 1);  i++) {
		var acct = results[i].clientCorporation.id
		console.log("bullhorn__getAccountForContactResults == " + acct + " i " + i + " length " + results.length);
		bullhorn__getAccountNameById(type, acct, i, results, bullhorn__dispatchAccountForContactResults);
	}
}
///////////////////////////////////////////////////////////////
function bullhorn__getJobSubmissionsForCandidateResults(results) {
	console.log("bullhorn__getJobSubmissionsForCandidateResults == " + JSON.stringify(results));

	for ( var i = 0; i <= (results.length - 1);  i++) {
		var id = results[i].id;
		console.log("bullhorn__getJobSubmissionsForCandidateResults == " + id + " i " + i + " length " + results.length);
		bullhorn__getJobNameById(id, i, results, bullhorn__dispatchJobForSubmissionResults);
	}
}

///////////////////////////////////////////////////////////////
function bullhorn__getJobNameById(candidateId, rownum, results, callback) {
	console.log("bullhorn__getJobNameById == " + candidateId);
	console.log("bullhorn__getJobNameById == " + rownum);

	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/jobSubmissions?where=candidate.id='+ candidateId;

	console.log("bullhorn__getJobNameById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("bullhorn__getJobNameById: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
				console.log("bullhorn__getJobNameById: length == <" + resp.length + ">");

					var str = '';
					for(var i = 0; i<resp.length; i++)
					{
						console.log("bullhorn__getJobNameById: resp.jobOrder.id == <" + resp[0].jobOrder.id + ">");

						if (i == 0)
							str += '{"resultrow": "'+ rownum + '", "jobId": "' + resp[0].jobOrder.id + '", "jobName": "' + resp[0].jobOrder.title + '"}';
						else
							str += ',{"resultrow": "'+ rownum + '", "jobId": "' + resp[0].jobOrder.id + '", "jobName": "' + resp[0].jobOrder.title + '"}';

					}
					callback(results, str, rownum, 1);

				bg.setCrmAuthStatus(true);
			} else {
				console.log("bullhorn__getJobNameById: xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getJobNameById: xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
var jobCount = 0;
var jobResult;
function bullhorn__dispatchJobForSubmissionResults(candidates, jobsdata, iteration, retcount) {
	jobCount += retcount;
	console.log("bullhorn__dispatchJobForSubmissionResults == " + jobCount);
	console.log("bullhorn__dispatchJobForSubmissionResults == " + JSON.stringify(candidates));
	if (jobCount == 1) {
		jobResult = jobsdata;
	} else if (jobCount > 1)  {
		jobResult += ',' + jobsdata;
	}


	if (jobCount == candidates.length) {
		//acctResult = '[' + acctResult + ']';
		console.error("bullhorn__dispatchJobForSubmissionResult: jobCount == " + candidates.length);
			console.error("bullhorn__dispatchJobForSubmissionResult: jobResult == " + jobResult);

		jobResult = jobResult.replace(/,\s*$/, "");
		jobResult = jobResult.replace(/^,/, '');
		bullhorn__dispatchContentByJobId(candidates, JSON.parse('[' + jobResult + ']')); // Activities
		bullhorn__handleCallResults("Candidate", candidates);
	}
}

////////////////////////////////////////////////////////////////////////////////////////
// the Build URL for Incident  Result Callback
function bullhorn__dispatchContentByJobId(candidates, jobs) {

	console.log("\n\nbullhorn__dispatchContentByJobId == " + JSON.stringify(candidates));
	console.log("\n\nbullhorn__dispatchContentByJobId == " + JSON.stringify(jobs));
	console.log("bullhorn__dispatchContentByJobId == " + jobs.length + "\n\n");
	var uri;

	if (jobs.length >= 1) {
		for ( var i = 0; i <= (jobs.length - 1);  i++) {
			console.log("bullhorn__dispatchContentByJobId == in for loop JobId " + jobs.length);
			if (i == 0) {
				uri = 'id=\''+ jobs[i].jobId + '\'';
			} else {
				uri += ' OR id=\'' +  jobs[i].jobId + '\'';
			}
			console.log("bullhorn__dispatchContentByJobId == JobId " + jobs.length);
		}
	} else if (jobs.length == 1){
		uri += 'id=\''+  jobs[0].jobId + '\'';
		console.log("bullhorn__dispatchContentByJobId == only 1 " + uri);
	}

	console.log("bullhorn__dispatchContentByJobId == url " + uri );
	bullhorn__getContentByJobId(candidates, encodeURIComponent('(' + uri + ')'));
}

///////////////////////////////////////////////////////////////
function bullhorn__getContentByJobId(candidates, uri) {
	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/joborders?where='+ uri;

	console.log("bullhorn__getContentByJobId: URL == " + url + ">");

	var xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("bullhorn__getContentByJobId: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
				console.log("bullhorn__getContentByJobId: length == <" + resp.length + ">");
				if (resp.length > 0) {
					console.log("bullhorn__getContentByJobId: resp.jobOrder.id == <" + resp[0].id + ">");
					console.log("\n\n\n");

					bullhorn__handleContentResults(resp);

				}
				bg.setCrmAuthStatus(true);
			} else {
				console.log("bullhorn__getContentByJobId: xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getContentByJobId: xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}
///////////////////////////////////////////////////////////////
function bullhorn__getAccountNameById(type, accountId, rownum, results, callback) {
	console.log("bullhorn__getAccountNameById == " + accountId);
	console.log("bullhorn__getAccountNameById == " + rownum);

	var header = lc.getCloudElementsId();

	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/corporations?where=id='+ accountId;

	console.log("bullhorn__getAccountNameById: URL == " + url + ">");

	var xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				console.log("bullhorn__getAccountNameById: xhr.responseText == <" +xhr.responseText + ">");
				var resp = JSON.parse(xhr.responseText);
				console.log("bullhorn__getAccountNameById: length == <" + resp.length + ">");
				if (resp.length > 0) {
					console.log("bullhorn__getAccountNameById: resp.Name == <" + resp[0].Name + ">");
					console.log("\n\n\n");
					var str = '{"resultrow": "'+ rownum + '", "accountId": "' + accountId + '", "accountName": "' + resp[0].name + '"}';
					//callback(resp, str, rownum, 1);
					callback(type, results, str, rownum, 1);
				}
				bg.setCrmAuthStatus(true);
			} else {
				console.log("bullhorn__getAccountNameById: xhr.responseText = " + xhr.responseText);
				console.log("bullhorn__getAccountNameById: xhr.status = " + xhr.status);
			}
		}
	}
	xhr.send(null);
}

////////////////////////////////////////////////////////////////////////////////////////
var acctCount = 0;
var acctResult;
function bullhorn__dispatchAccountForContactResults(type, contacts, acctdata, iteration, retcount) {
	acctCount += retcount;
	console.log("bullhorn__dispatchAccountForContactResults == " + acctCount);
	console.log("bullhorn__dispatchAccountForContactResults == " + JSON.stringify(contacts));
	console.log("bullhorn__dispatchAccountForContactResults :: type = " + type);

	if (acctCount == 1) {
		acctResult = acctdata;
	} else if (acctCount > 1)  {
		acctResult += ',' + acctdata;
	}

	if (acctCount == contacts.length) {
		//acctResult = '[' + acctResult + ']';

		bullhorn__dispatchContentByAccountId(contacts, JSON.parse('[' + acctResult + ']')); // Activities
		bullhorn__handleCallResults(type, contacts, JSON.parse('[' + acctResult + ']'));
	}
}

function bullhorn__dispatchContentByAccountId(contacts, accounts) {

	console.log("\n\bullhorn__dispatchContentByAccountId == " + JSON.stringify(contacts));
	console.log("\n\bullhorn__dispatchContentByAccountId == " + JSON.stringify(accounts));
	console.log("bullhorn__dispatchContentByAccountId == " + accounts.length + "\n\n");
	var uri;

	if (accounts.length >= 1) {
		for ( var i = 0; i <= (accounts.length - 1);  i++) {
			console.log("bullhorn__dispatchContentByAccountId == in for loop AccountId " + accounts.length);
			if (i == 0) {
				uri = 'clientCorporation.id=\''+ accounts[i].accountId + '\'';
			} else {
				uri += ' OR clientCorporation.id=\'' +  accounts[i].accountId + '\'';
			}
			console.log("bullhorn__dispatchContentByAccountId == AccountId " + accounts.length);
		}
	} else if (accounts.length == 1){
		uri += 'clientCorporation.id=\''+  accounts[0].accountId + '\'';
		console.log("bullhorn__dispatchContentByAccountId == only 1 " + uri);
	}

	console.log("bullhorn__dispatchContentByAccountId == url " + uri );
	bullhorn__getContentByAccountId(contacts, encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function bullhorn__getContentByAccountId(contacts, uri) {
	console.log("\n" +lc.getContentPrimary() + "\nbullhorn__getContentByAccountId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();

	if (lc.getContentPrimary() == 'job-orders') {
		url += '/joborders?where=' + uri;
	} else if (lc.getContentPrimary() == 'opportunities') {
		url += '/opportunities?where=' + uri;
	}

	console.log("\n" + lc.getContentPrimary() + "\nbullhorn__getContentByAccountId == " + uri);
	console.log("\n" + lc.getContentPrimary() + "\n\n\nbullhorn__getContentByAccountId == " + url);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("bullhorn__getContentByAccountId == " + xhr.status)
				//console.log("bullhorn__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("bullhorn__getAccountById == " + acctId);
				console.log("bullhorn__getContentByAccountId == " + JSON.stringify(resp, null, 2));
				if (resp.length > 0) {
					//if ((lc.getContentPrimary() == 'activities') || (lc.getContentPrimary() == 'opportunities')) {
					bullhorn__handleContentResults(resp);
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
function bullhorn__dispatchContentByContactId(contacts, callback) {

	console.log("\n\zbullhorn__dispatchContentByContactId == " + JSON.stringify(contacts));
	console.log("bullhorn__dispatchContentByContactId == " + contacts.length + "\n\n");
	var uri;

	if (contacts.length > 1) {
		for ( var i = 0; i <= (contacts.length - 1);  i++) {
			if (i == 0) {
				uri = 'clientContact.id=\''+ contacts[i].id + '\'';
			} else {
				uri += ' OR clientContact.id=\'' +  contacts[i].id + '\'';
			}
		}
	} else if (contacts.length == 1){
		uri = 'clientContact.id=\''+  contacts[0].id + '\'';
		console.log("bullhorn__dispatchContentByContactId == only 1 " + uri);
	}

	console.log("bullhorn__dispatchContentByContactId == url " + uri );
	callback(encodeURIComponent('(' + uri + ')'));
}
////////////////////////////////////////////////////////////////////////////////////////
function bullhorn__handleCallResultsForCandidates(candidates) {
	console.log("bullhorn__handleCallResultsForCandidates num: " + candidates.length);
	jobCount = 0;
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();

	if (candidates.length) {
		anchorHead.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + (candidates.length + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
			"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Caller Type</td>',
			"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
			"rowend"   : 	'</tr>'
		});
	}

	for ( var i = 0; i <= (candidates.length - 1);  i++) {
		console.log("Candidate: " + JSON.stringify(candidates[i]))
		var name = candidates[i].name;

		var id = candidates[i].id;
		nameDict[id] = name;
		achorString.dataRows.push({
			"rowstart": '<tr id="remove-' + i + '">',
			"cell_1": '<td action="openwindow" type="candidates" uid="' + id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2": '<td>Candidate</td>',
			"cell_3": '<td action="openwindow" type="placement"  uid="' + id + '">Placement</td>',
			"rowend": '</tr>'
		});
	}

	var anchorData = {};

	if(bg.getAnchorTableData() != 'false')
	{
		console.log("false")
		anchorData = bg.getAnchorTableData() + JSON.stringify(achorString);

	}
	else
		anchorData = JSON.stringify(achorString);




	bg.setAnchorTheadData(JSON.stringify(anchorHead));
	bg.setAnchorTableData(anchorData);

}
////////////////////////////////////////////////////////////////////////////////////////
function bullhorn__handleCallResults(type, contacts, accounts) {
	console.warn("bullhorn__handleCallResults type " + type + " len:" + contacts.length);
	console.warn("bullhorn__handleCallResults type " + JSON.stringify(contacts, null,2));
	
	acctCount = 0;
	var anchorHead = {};
	var achorString = {};
	anchorHead.dataRows = new Array();
	achorString.dataRows = new Array();

	if (contacts.length) {
		anchorHead.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + (contacts.length + 1) + '">',
			"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
			"cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Caller Type</td>',
			"cell_3"   : 	'<th id="anchor-head-3" class="contacts-table">Create</td>',
			"rowend"   : 	'</tr>'
		});
	}

	var openWindow = "",actionName = "", actionType = "", action = "";

	switch(type)
	{
		case "Candidate":
			openWindow = "candidates";
			actionName = "Placement";
			actionType = "candidates"
			action = "openwindow";
			break;
		case "Client Contact":
			openWindow = "contacts";
			actionName =  lc.getContentPrimary();
			actionType =  lc.getContentPrimary();
			action = "create";
			break;
		case "Lead":
			openWindow = "leads";
			actionName = "";// lc.getContentPrimary();
			actionType = "";// lc.getContentPrimary();
			action = "";//"create";
			break;
	}

	for ( var i = 0; i <= (contacts.length - 1);  i++) {
		console.log("bullhorn__handleCallResults::Contact: " + JSON.stringify(contacts[i]))
		var name = contacts[i].name;

		var id = contacts[i].id;
		nameDict[id] = name;
		var acctId = 0;
		if ((type == "Client Contact" || type == "Lead") && (contacts[i].clientCorporation)){
			acctId = contacts[i].clientCorporation.id;
		}

		achorString.dataRows.push({
			"rowstart": '<tr id="remove-' + i + '">',
			"cell_1": '<td action="openwindow" type="' + openWindow + '" uid="' + id + '" class="contacts-table-name">' + name + '</td>',
			"cell_2": '<td>' + type + '</td>',
			"cell_3": '<td action="' + action + '" type="' + actionType + '"  uid="' + id + '" acctid="' + acctId +'">' + actionName + '</td>',
			"rowend": '</tr>'
		});
	}

	console.log("bg.getAnchorTableData() " + bg.getAnchorTableData())

	var anchorData = {};

	if(bg.getAnchorTableData() != 'false')
	{
		console.log("NOT false")
		console.log("datarows " + achorString.dataRows.length)
		var oldAnchorData = JSON.parse(bg.getAnchorTableData());
		console.log("old datarows " + oldAnchorData.dataRows.length)

		for (var i=0; i < achorString.dataRows.length; i++)
		{
			oldAnchorData.dataRows.push(achorString.dataRows[i]);
		}
		anchorData = oldAnchorData;
	}
	else
		anchorData = achorString;

	bg.setAnchorTheadData(JSON.stringify(anchorHead));
	bg.setAnchorTableData(JSON.stringify(anchorData));
}

////////////////////////////////////////////////////////////////////////////////////////
function bullhorn__getContentByContactId(uri) {
	console.log("\n" +lc.getContentPrimary() + "\nbullhorn__getContentByContactId == " + uri);
	var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	url += '/opportunities?where=' + uri;

	console.log("\n" + lc.getContentPrimary() + "\nbullhorn__getContentByContactId == " + uri);
	var header = lc.getCloudElementsId();


	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open('GET', url, true);
	xhr.setRequestHeader("authorization",  header );
	xhr.setRequestHeader("cache-control", "no-cache");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ( xhr.status == 200 ) {
				//console.log("bullhorn__getContentByAccountId == " + xhr.status)
				//console.log("bullhorn__getContentByAccountId == " + xhr.responseText)
				var resp = JSON.parse(xhr.responseText);
				//console.log("bullhorn__getAccountById == " + acctId);
				console.log("bullhorn__getContentByAccountId == " + JSON.stringify(resp, null, 2));

				bullhorn__handleContentResults(resp);
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
function bullhorn__handleContentResults(content) {

	var contentUrl;
	var rowCount = content.length;
	console.log("bullhorn__handleContentResults: rowCount == " + rowCount + " | " + lc.getContentPrimary());
	var contentJson = {};
	var theadJson = {};
	contentJson.dataRows = new Array();
	theadJson.dataRows = new Array();

	console.log('bullhorn__handleContentResults nameDict == ' + JSON.stringify(nameDict, null, 2));
	if (rowCount) {
		if (lc.getContentPrimary() == 'job-orders') {
			theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Title</th>',
				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Type</th>',
				"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Status</th>',
				"cell_4"   : 	'<th id="content-head-4" class="contacts-table">Salary</th>',
				"rowend"   : 	'</tr>'
			});
		} else if (lc.getContentPrimary() == 'opportunities') {
			theadJson.dataRows.push({
				"rowstart" : 	'<tr id="remove-' + (rowCount + 1) + '">',
				"cell_1"   : 	'<th id="content-head-1" class="contacts-table">Title</th>',
				"cell_2"   : 	'<th id="content-head-2" class="contacts-table">Type</th>',
				"cell_3"   : 	'<th id="content-head-3" class="contacts-table">Status</th>',
				"cell_4"   : 	'<th id="content-head-4" class="contacts-table">Priority</th>',
				"rowend"   : 	'</tr>'
			});
		}
	}

	for ( var i = 0; i <= (content.length - 1);  i++) {
		if (lc.getContentPrimary() == 'job-orders') {

			if(content[i].isOpen != true)
				break;

			var col1 = content[i].title;
			var col2 = content[i].employmentType;
			var col3 = content[i].status;
			var col4 = content[i].salary;
			var id = content[i].id;

		} else if (lc.getContentPrimary() == 'opportunities') {

			if(content[i].isOpen != true)
				break;

			var col1 = content[i].title;
			var col2 = content[i].type;
			var col3 = content[i].status;
			var col4 = content[i].customText1 || '';
			var id = content[i].id;
		}


		contentJson.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col1 + '</td>',
			"cell_2"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col2 + '</td>',
			"cell_3"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col3 + '</td>',
			"cell_4"   : 	'<td action="openwindow" type="'+ lc.getContentPrimary() +'"" contentid="'+ id + '" class="contacts-table-name">' + col4 + '</td>',
			"rowend"   : 	'</tr>'
		});

	}


	var contentData = {};

	if(bg.getContentTableData() != 'false')
	{
		console.log("NOT false")
		console.log("datarows " + contentJson.dataRows.length)
		var oldContentData = JSON.parse(bg.getContentTableData());
		console.log("old datarows " + oldContentData.dataRows.length)

		for (var i=0; i < contentJson.dataRows.length; i++)
		{
			oldContentData.dataRows.push(contentJson.dataRows[i]);
		}
		contentData = oldContentData;
	}
	else
		contentData = contentJson;



	bg.setContentTheadData(JSON.stringify(theadJson));
	bg.setContentTableData(JSON.stringify(contentData));
}
