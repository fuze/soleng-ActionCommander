'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')

const fuzeUrl = pjson.config.fuzeUrl;

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const bg = require('../generalSetGet')
const lc 	= require('../localConfigSettings');


///////////////////////////////////////////////////////////////
 exports.vtiger_callHandler = function(callState, json) {


	bg.setCallDirection(json.direction);

	if (callState == 'RING' || callState == 'DIAL'){
		console.log("vtiger_callHandler: RING Caller ID == " + json.clidname + " " + json.clid);

		bg.setStarttime('mdy');

		if (callState == 'RING') {
			bg.setFormattedCallID(json.clid);
			bg.setCallerName(json.clidname);
			bg.setRawStartTime(json.timestamp);
			bg.setRawCallId(json.clid);
		} else if (callState == 'DIAL') {
			bg.setRawCallId(json.destnumber);
			bg.setRawStartTime(json.timestamp);
			if (json.destname !== 'undefined') {
				bg.setCallerName(json.destname);
			} else {
				bg.setCallerName('Unknown');
			}
			bg.setFormattedCallID(json.destnumber);
			bg.setCallerName('Searching');
		}
		console.log("vtiger_callHandler: RING vtiger_getContactByPhone");
		vtiger_getContactByPhone(callState, json, vtiger_getLeadByPhone);
		bg.setCallState(callState);
	} else if (callState == 'CONNECT') {

		console.log("vtiger_callHandler: CONNECT Caller ID == " + json.clidname);
		console.log("vtiger_callHandler: ring starttime == " + json.clidname);
		//bg.setStarttime('mdy');


	} else if (callState == 'CALL_END') {
		console.log("vtiger_callHandler: CALL_END Caller ID == " + json.clidname);
		//vtiger_createEvent(json);
		vtiger_createEventDispatcher(json, 0)
		bg.setCallState(callState);
		bg.createCallHistory();
		bg.resetBackGrounData();
	}
};
///////////////////////////////////////////////////////////////
exports.vtiger_Validate = function(callback) {
	console.log("vtiger_Validate: " );
	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/accessKey?&vt_name='+ pjson.config.userData.crmid;
		url += '&vt_admin=' + pjson.config.userData.adminuser;
		url += '&vt_adminkey=' + pjson.config.userData.adminpasswd;
		url += '&vt_url=\'' + vt_url + '\'';
	console.log("vtiger_Validate: " + url);

	var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
  		if (xhr.readyState == 4) {
  			console.log("vtiger_Validate: raw == " + xhr.responseText);
  			var resp = JSON.parse(xhr.responseText);
  			console.log("vtiger_Validate: resp.success == " + JSON.stringify(resp));
  			if(resp.accesskey) {
  				lc.setCrmToken(resp.accesskey);
  				bg.setCrmAuthStatus(true);
  				callback(JSON.parse('{"code" : 200, "action" : 3000, "event" : "end-point-validated",  "message" : "End Point Validated" }'));
  			} else {
  				lc.setCrmToken(null);
  				bg.setCrmAuthStatus(false);
  				console.error("vtiger_Validate: Invalid CRM User");
  				callback(JSON.parse('{"code" : 401, "action" : 3001, "event" : "end-point-invalid",  "message" : "End Not Point Validated" }'));
  			}
  		}
	}
	xhr.send();
}
////////////////////////////////////////////////////////////////////////////////////////
function vtiger_getContactByPhone(callState, json, callback) {

	console.log("vtiger_getContactByPhone: json.direction == " + json.direction);
	console.log("vtiger_getContactByPhone: json.destnumber == " + json.destnumber);
	console.log("vtiger_getContactByPhone: json.clid == " + json.clid);
	bg.setContactLeadType('contact');
	// This can be done better !!!
	var callerId = '';
	if (json.direction == 'INBOUND') {
		callerId = json.clid;
	} else if (json.direction == 'OUTBOUND') {
		callerId = json.destnumber;
	}

	var clid = '';
	if (callerId.indexOf('+') == -1) {
		clid = callerId.substring(1);
	} else {
		clid = callerId.substring(2);
	}
	var fmtCallId = bg.setFormattedCallID(callerId);
	// End of improvement
console.log("vtiger_getContactByPhone: callerId == " + callerId);
console.log("vtiger_getContactByPhone: clid == " + clid);

	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = pjson.config.fuzeUrl +  '/' + pjson.config.userData.routepath +'/caller?vt_phone='+ clid;
		url += '&vt_user=' + pjson.config.userData.crmid;
		url += '&vt_userkey=' + bg.getCrmToken();
		url += '&vt_url=\'' + vt_url + '\'';

	if (vtwfdebug == 1) { console.log("vtiger_getContactByPhone: url == " + url); }

	var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
  		if (xhr.readyState == 4) {
  			//console.log("raw == " + xhr.responseText);
  			resp = JSON.parse(xhr.responseText);
  			console.log("vtiger_getContactByPhone: resp.success == " + JSON.stringify(resp));
  				if  (resp.length > 0) {
					rowCount = resp.length;

					bg.setCallerName(resp[i].firstname + " " + resp[i].lastname);
					bg.setContactRole('Contact');

					vtiger_handleCallResults('contact', callState, clid, resp);
					if (vtwfdebug == 1) { console.log("vtiger_getContactByPhone Length = " + rowCount); }
					//vtiger_getLeadByPhone(callState, json);
				} else if (resp.code == "404"){
					callback(callState, json);
					console.log("vtiger_getContactByPhone: Error: " + resp.code);
					console.log("vtiger_getContactByPhone: Message: " + JSON.stringify(resp));
				} else {
					console.log("Unknown Error ");
				}
		}
	}
	xhr.send();
}
////////////////////////////////////////////////////////////////////////////////////////
function vtiger_getAccountById(accountId) {
	if (!accountId)  {
		return 'N/A';
	}

	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = fuzeUrl + '/' + pjson.config.userData.routepath +'/account?vt_account='+ accountId;
		url += '&vt_user=' + pjson.config.userData.crmid;
		url += '&vt_userkey=' + bg.getCrmToken();
		url += '&vt_url=\'' + vt_url + '\'';
	//console.log("vtiger_getAccountById: " + url);
	if (vtwfdebug == 1) { console.log("vtiger_getAccountById: url == " + url); }

	var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
  		if (xhr.readyState == 4) {
  			//console.log("raw == " + xhr.responseText);
  			resp = JSON.parse(xhr.responseText);
  			//console.log("vtiger_getAccountById: resp.success == " + JSON.stringify(resp));
  			if (resp.code == "404") {
				//console.log("Error: " + resp.code);
				//console.log("Message: " + resp.message);
				return "No Account";
			} else if (resp.length > 0) {
				if (vtwfdebug == 1) { console.log("vtiger_getAccountById: success " + resp.code); }
				return resp.accountname;
			} else {
				//console.log("vtiger_getAccountById: Unknown Error");
				return "No Account";
			}
  		}
	}
	xhr.send();
}

////////////////////////////////////////////////////////////////////////////////////////
function vtiger_getLeadByPhone(callState, json) {


	console.log("vtiger_getContactByPhone: json.direction == " + json.direction);
	console.log("vtiger_getContactByPhone: json.destnumber == " + json.destnumber);
	console.log("vtiger_getContactByPhone: json.clid == " + json.clid);

	bg.setContactLeadType('lead');
	// This can be done better
	var callerId = '';
	if (json.direction == 'INBOUND') {
		callerId = json.clid;
	} else if (json.direction == 'OUTBOUND') {
		callerId = json.destnumber;
	}
	var clid = '';
	if (callerId.indexOf('+') == -1) {
		clid = callerId.substring(1);
	} else {
		clid = callerId.substring(2);
	}

	var fmtCallId = bg.setFormattedCallID(callerId);
	// End of get better
	console.log("vtiger_getLeadByPhone: callerId == " + callerId);
	console.log("vtiger_getLeadByPhone: clid == " + clid);

	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/lead?vt_phone='+ clid;
		//var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/lead?vt_phone='+ clid;
		url += '&vt_user=' + pjson.config.userData.crmid;
		url += '&vt_userkey=' + bg.getCrmToken();
		url += '&vt_url=\'' + vt_url + '\'';

	if (vtwfdebug == 1) { console.log("vtiger_getLeadByPhone: url == " + url); }

	var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
  		if (xhr.readyState == 4) {
  			console.log("vtiger_getLeadByPhone: raw == " + xhr.responseText);
  			resp = JSON.parse(xhr.responseText);
  			console.log("vtiger_getLeadByPhone: resp.success == " + JSON.stringify(resp));
  			if (resp.code == "404") {
				console.log("vtiger_getLeadByPhone: Error: " + resp.code);
				console.log("vtiger_getLeadByPhone: Message: " + resp.message);
				vtiger_getCampaignByPhone(callState, clid, json);
			} else if (resp.length > 0) {
				rowCount = resp.length;
				bg.setCallerName(resp[0].firstname + " " + resp[0].lastname);
				bg.setContactRole('Lead');
				vtiger_handleCallResults('lead', callState, clid, resp);
				if (vtwfdebug == 1) { console.log("vtiger_getLeadByPhone: Length = " + rowCount); }
				return 1;
			} else {
				console.log("vtiger_getLeadByPhone:");
			}
  		}
	}
	xhr.send();
}
////////////////////////////////////////////////////////////////////////////////////////
function vtiger_getCampaignByPhone(callState, clid, json) {
	var cmpNum = json.destnumber;
	console.log("vtiger_getCampaignByPhone: cmpNum == " + cmpNum);

	var campaignNumber = cmpNum.substring(2)
	console.log("vtiger_getCampaignByPhone: campaignNumber == " + campaignNumber);

	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/campaign?vt_phone='+ campaignNumber;
		url += '&vt_user=' + pjson.config.userData.crmid;
		url += '&vt_userkey=' + bg.getCrmToken();
		url += '&vt_url=\'' + vt_url + '\'';

	if (vtwfdebug == 1) { console.log("vtiger_getCampaignByPhone: url == " + url); }

	var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
  		if (xhr.readyState == 4) {
  			console.log("vtiger_getCampaignByPhone: raw == " + xhr.responseText);
  			resp = JSON.parse(xhr.responseText);
  			console.log("vtiger_getCampaignByPhone: resp.success == " + JSON.stringify(resp));
  			if (resp.code == "404") {
				console.log("vtiger_getCampaignByPhone: Error: " + resp.code);
				console.log("vtiger_getCampaignByPhone: Message: " + resp.message);
				vtiger_createNewLead(callState, json, false);
				return;
			} else if (resp.length > 0) {
				rowCount = resp.length;
				if (rowCount > 1) {
					alert("vtiger_getCampaignByPhone: There is more than 1 Campaign assigned to " + clid);
				}
				console.log("vtiger_getCampaignByPhone: json = " + JSON.stringify(resp));
				var campId = resp[0].id; var indx = campId.indexOf('x');
				campId = campId.substring(indx + 1);
				if (vtwfdebug == 1) {
					console.log("vtiger_getCampaignByPhone: campId = " + campId);
					console.log("vtiger_getCampaignByPhone: Length = " + rowCount);
					console.log("vtiger_getCampaignByPhone: json = " + JSON.stringify(resp));
				}
				vtiger_createNewLead(callState, json, campId);
			} else {
				console.log("vtiger_getCampaignByPhone: Unknown Error ");
			}
  		}
	}
	xhr.send();
}
////////////////////////////////////////////////////////////////////////////////////////
function vtiger_createNewLead(callState, json, id) {

	if (vtwfdebug == 1) {
		console.log("vtiger_createNewLead: json == " + JSON.stringify(json) );
		console.log("vtiger_createNewLead: json clidname " + json.clidname );
		console.log("vtiger_createNewLead: campaignNumber " + id );
	}

	bg.setContactLeadType('lead');

	var name = json.clidname.split(',');
	if (vtwfdebug == 1) { console.log("vtiger_createNewLead: name" + name); }
	var callerId = json.clid;
	var clid = callerId.substring(2);
	var vt_url = pjson.config.userData.baseurl + '/index.php?module=Leads&view=Edit&lastname=';
	//var vt_url = 'https://dev-crm.lowtcenter.com/vtigercrm/index.php?module=Leads&view=Edit&lastname=';
	vt_url += name[0] + '&firstname=' + name[1] +'&phone=' + clid;

	bg.setCallerName(name[1] + " " + name[0]);

	if (id !== false) {
		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: campaignNumber == false"); }
		//console.log("vtiger_createNewLead: Create a New Lead Assign to the Campaign");
		var url = vt_url + '&sourceModule=Campaigns&sourceRecord=' + id;

		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: url" + url ); }
		var new_window = window.open(url, 'Lead ' + name[1] + ' ' + name[0]);
		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: new_window" + new_window ); }
		new_window.focus();
		bg.setContactRole('New Lead');
	} else {
		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: campaignNumber != false"); }
		var url = vt_url;
		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: url " + url); }
		var new_window = window.open(url, 'Lead ' + name[1] + ' ' + name[0]);
		if (vtwfdebug == 1) { console.log("vtiger_createNewLead: new_window" + new_window ); }
		new_window.focus();

		bg.setContactRole('New Campaign Lead');
	}

}
////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function vtiger_handleCallResults(type, callState, clid, json) {
	var url = pjson.config.userData.baseurl;
	var jsonString = {};
	jsonString.dataRows = new Array();

	var rowCount = json.length;
	bg.setFormattedCallID(clid);

	jsonString.dataRows.push({
    	"rowstart" : 	'<tr id="remove-'+ rowCount + 1 + '">',
		"cell_1"   : 	'<th id="anchor-head-1" class="contacts-table">Caller</td>',
        "cell_2"   : 	'<th id="anchor-head-2" class="contacts-table">Organization</td>',
       	"rowend"   : 	'</tr>'

	});

	for ( i = 0; i <= (rowCount - 1);  i++) {
		var name = json[i].firstname + " " + json[i].lastname;
		//console.log("\n\nRawid == " + json[i].id + "\n\n");
		var rawid = json[i].id;
		var indx = rawid.indexOf('x');
		var id = rawid.substring(indx + 1);
		var acctId = json[i].account_id;
		var acct = 'N/A';
		if (acctId) {
			if ( acct = vtiger_getAccountById(acctId)) {
				if (vtwfdebug == 1) {
					console.log("vtiger_handleCallResults: acct = " + acct );
				}
			}
		}
		if(type == 'contact') {
			url += '/index.php?module=Contacts&view=Detail&record=' + id;
		} else if (type == 'lead') {
			url += '/index.php?module=Leads&view=Detail&record=' + id;
		}
		if (vtwfdebug == 1) {
			console.log("vtiger_handleCallResults: Name == " + name);
			//console.log("vtiger_handleCallResults: ID == " + id);
			console.log("vtiger_handleCallResults: ID == " + rawid.substring(rawid.indexOf('x') + 1));
			console.log("vtiger_handleCallResults: Rawid == " + rawid);
			console.log("vtiger_handleCallResults: URL == " + url);
			console.log("vtiger_handleCallResults: acct == " + acct);
			console.log("vtiger_handleCallResults: Organization == " + acct);
		}

		jsonString.dataRows.push({
			"rowstart" : 	'<tr id="remove-' + i + '">',
			"cell_1"   : 	'<td name="' + rawid + '" class="contacts-table-name"> <a target="_blank" href=' + url + ' >' + name + '</a></td>',
        	"cell_2"   : 	'<td class="contacts-table-name" action="openwindow" type="vtiger" acctid="'+ acctId +'">' + acct + '</td>',
       		"rowend"   : 	'</tr>'
		});

		if (rowCount == 1) {
			console.log('1 vtiger_handleCallResults: tblstr ' + jsonString);
			console.log('1 vtiger_handleCallResults: tblstr ' + JSON.stringify(jsonString));
			bg.setAnchorTableData(JSON.stringify(jsonString));
			console.log("vtiger_handleCallResults: URL == " + url);
			bg.setContactLeadId(json[i].id);
			var new_window = window.open(url, 'Contact ' + name);
			new_window.focus();
			//bg.setCallState(callState);
		}

	}

	if (rowCount > 1) {
		console.log('vtiger_handleCallResults: tblstr ' + jsonString);
		console.log('vtiger_handleCallResults: tblstr ' + JSON.stringify(jsonString));
		bg.setAnchorTableData(JSON.stringify(jsonString));

	}
}

////////////////////////////////////////////////////////////////////////////////////////
function vtiger_createEventDispatcher(json, iteration) {
	console.log("vtiger_createEventDispatcher: bg.getContactLeadId() == " + bg.getContactLeadId());
	rawid = bg.getContactLeadId();
	if ((rawid !== 'false') || ((rawid !== 'false') && (iteration > 5))) {
		console.log("vtiger_createEventDispatcher: bg.getContactLeadId() == (rawid !== 'false') && (iteration > 5)");
		vtiger_createEvent(json);
	} else {
		vtiger_getSingleLeadByPhone(json, iteration);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
var singleCallerId;
var singleClid;
var singleFmtCallId;
function vtiger_getSingleLeadByPhone(json, iteration, callback) {

	console.log("vtiger_getSingleLeadByPhone: json.direction == " + json.direction);
	console.log("vtiger_getSingleLeadByPhone: json.destnumber == " + json.destnumber);
	console.log("vtiger_getSingleLeadByPhone: json.clid == " + json.clid);
	if (iteration == 0) {
		bg.setContactLeadType('lead');
		// This can be done better
		if (json.direction == 'INBOUND') {
			singleCallerId = json.clid;
		} else if (json.direction == 'OUTBOUND') {
			singleCallerId = json.destnumber;
		}
		var singleClid = '';
		if (singleCallerId.indexOf('+') == -1) {
			singleClid = singleCallerId.substring(1);
		} else {
			singleClid = singleCallerId.substring(2);
		}
		var fmtCallId = bg.setFormattedCallID(singleCallerId);
	}

	if (iteration < 5) {
		iteration += 1;
		setTimeout(function () {
			// End of get better
			console.log("vtiger_getSingleLeadByPhone: callerId == " + singleCallerId);

			var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
			var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/lead?vt_phone='+ singleClid;
				url += '&vt_user=' + pjson.config.userData.crmid;
				url += '&vt_userkey=' + bg.getCrmToken();
				url += '&vt_url=\'' + vt_url + '\'';

			if (vtwfdebug == 1) { console.log("vtiger_getSingleLeadByPhone: url == " + url); }

			var xhr = new XMLHttpRequest();
    		xhr.open('GET', url, true);
    		xhr.onreadystatechange = function() {
  				if (xhr.readyState == 4) {
  					console.log("vtiger_getSingleLeadByPhone: raw == " + xhr.responseText);
  					resp = JSON.parse(xhr.responseText);
  					console.log("vtiger_getSingleLeadByPhone: resp.success == " + JSON.stringify(resp));
  					if (resp.code == "404") {
						console.log("vtiger_getSingleLeadByPhone: Error: " + resp.code);
						console.log("vtiger_getSingleLeadByPhone: Message: " + resp.message);
						vtiger_createEventDispatcher(json, iteration, callback);
					} else if (resp.length > 0) {
						rowCount = resp.length;
						bg.setContactLeadId(resp[0].id);
						bg.setContactLeadType('lead');
						console.log("vtiger_getSingleLeadByPhone: Length = " + rowCount);
						vtiger_createEventDispatcher(json, iteration + 5, callback);
					} else {
						console.log("vtiger_getLeadByPhone:");
					}
  				}
			}
			xhr.send();
		}, 60000);
	}
}
////////////////////////////////////////////////////////////////////////////////////////
function vtiger_createEvent(json) {
	//console.log("vtiger_createEvent: ");
	var username = pjson.config.userData.username
			username = username.substr(0,username.indexOf(' '))
	var starttime = bg.getStarttime();
	var endtime = getFormattedDate('mdy');
	var rawid = bg.getContactLeadId();
	var recording = encodeURIComponent(pjson.config.userData.recordingbaseurl + '?userID=' + username + '&callId=' + bg.getCallIdFromSocket());
	//if (rawid)

	console.log("vtiger_createEvent: start Value == " + starttime);
	console.log("vtiger_createEvent: end Value == " + endtime);
	console.log("vtiger_createEvent: rawid == " + rawid );
	console.log("vtiger_createEvent: vt_user == " + pjson.config.userData.crmid);
	console.log("vtiger_createEvent: type == " + bg.getContactLeadType());
	console.log("vtiger_createEvent: vt_userkey == " + bg.getCrmToken());
	console.log("vtiger_createEvent: vt_recording == " + recording);

	var vt_url = pjson.config.userData.baseurl + pjson.config.userData.url_option;
	var url = fuzeUrl + '/' + pjson.config.userData.routepath + '/event?vt_id='+ rawid;
		url += '&vt_user=' + pjson.config.userData.crmid;
		url += '&vt_userkey=' + bg.getCrmToken();
		url += '&vt_start=' + starttime + '&vt_end=' + endtime;
		url += '&subject=Call - '+ getFormattedDate('mdy');
		if (pjson.config.userData.recordingbaseurl) {
			url += '&vt_field='+ pjson.config.userData.recording_field;
			url += '&vt_recording=' +  recording;
		} else {
			url += '&vt_field=null';
			url += '&vt_recording=null';
		}
		url += '&type=' + bg.getContactLeadType();
		url += '&vt_url=\'' + vt_url + '\'';

	if (vtwfdebug == 1) { console.log("vtiger_createEvent: url == " + url); }

	if (rawid) {
		var xhr = new XMLHttpRequest();
    	xhr.open('GET', url, true);
    	xhr.onreadystatechange = function() {
  			if (xhr.readyState == 4) {
  				console.log("raw == " + xhr.responseText);
  				resp = JSON.parse(xhr.responseText);
  				console.log("resp.success == " + JSON.stringify(resp));
  				if (resp.code == "404") {
					console.log("Error: " + resp.code);
					console.log("Message: " + resp.message);
				}
  			}
		}
		xhr.send();
	}
}
////////////////////////////////////////////////////////////////////////////////////////
