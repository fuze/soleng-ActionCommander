'use strict'


var _wrapUpCodes; // = bg.getWrapUpCode();
var _callNotes; // = getCallNotes();
var _endTime;
var _callerName;
var subjectList = ['Call', 'Cold call', 'Follow up', 'Collections', 'Invoicing', 'Qualify Lead'];

var subject_div			= document.getElementById('subject-div');
var subject				= document.getElementById('subject');
var wrapup_code_div		= document.getElementById('wrapup-code-div');
var wrapup_code			= document.getElementById('wrapup-code');
var wrapup_notes_div	= document.getElementById('wrapup-notes-div');
var wrapup_notes		= document.getElementById('wrapup-notes')
var wrapup_info_caller	= document.getElementById('wrapup-info-caller')
var wrapup_info_time	= document.getElementById('wrapup-info-time')
var save 				= document.getElementById('save');

console.log("focusvisionCallnotes.js");

ipcRenderer.on('utility-loaded', (event, arg) => {
  console.info("wrapupNotes") 
	_wrapUpCodes = lc.getWrapUpCode();
	_callNotes = lc.getCallNotes();
	_endTime = Date.now();
	if (arg)
		_callerName = arg;

	console.log("imb.wrapupNotes.js  getWrapUpCode == " + lc.getWrapUpCode());
	console.log("imb.wrapupNotes.js  getCallNotes == " + lc.getCallNotes());
	console.log("imb.wrapupNotes.js  myParam == " + _endTime);
	console.log("imb.wrapupNotes.js  arg == " + _callerName);

	setInitialState();
	
	var thisWindow = remote.getCurrentWindow();
    thisWindow.focus()
});

//////////////////////////////////////////////////////////////////////////
function getDateTime(timestamp) {

	var date = new Date(timestamp*1000);
	var datetime = date.getFullYear() + '-'
		+ String("0" + (date.getMonth()+1)).substr(-2) + '-'
		+ String("0" + date.getDate()).substr(-2) + ' '
		+ String("0" + date.getHours()).substr(-2) + ':'
		+ String("0" + date.getMinutes()).substr(-2) + ':'
		+ String("0" + date.getSeconds()).substr(-2);

	console.log(datetime)
	return datetime;
}
//////////////////////////////////////////////////////////////////////////
function setInitialState() {
	
	if(typeof _wrapUpCodes == 'string') {
		console.log("wrapup_code == " + _wrapUpCodes);
		var array = new Array();
		array = _wrapUpCodes.split(",");
		for (var i in array) {
			var optn = document.createElement("OPTION");
			optn.text = array[i];
    		optn.value = array[i];
			console.log("Value == " + array[i]);
			wrapup_code.options.add(optn);
		}
	} else {
		wrapup_code_div.parentNode.removeChild(wrapup_code_div);
		wrapup_code_div.style.visibility	= 'hidden';
	}

	if(_callNotes != 1) {
		wrapup_notes_div.parentNode.removeChild(wrapup_notes_div);
		wrapup_notes_div.style.visibility	= 'hidden';
	}

	var timestamp =  Math.round(_endTime/1000);

	{
		for (var i in subjectList) {
			var optn = document.createElement("OPTION");
			optn.text = subjectList[i];
			optn.value = subjectList[i];
			console.log("Value == " + subjectList[i]);
			subject.options.add(optn);
		}
	}
	wrapup_info_caller.text = decodeURIComponent(_callerName);
	wrapup_info_time.text = getDateTime(timestamp);
}
//////////////////////////////////////////////////////////////////////////
save.onclick = function() {
	console.log("Save Button " + wrapup_code.value);
	if ((_callNotes == 1) && (wrapup_notes.value === '')) {
		if(confirm('No Call Notes Entered. Do you want to continue?')) {
			wrapup_notes.value = 'Note Entry Skipped by User';
		}
	}
	
	save.disabled = true;
	bg.setWrapUpValue(wrapup_code.value);
	bg.setNoteValue(wrapup_notes.value);
	bg.setCallSubjectValue(subject.value);

	console.log("Save Button " + wrapup_notes.value);
	var json = JSON.parse('{"type":"postNote", "endtime" : "' + _endTime + '" }');
    //bg.utilityActionController('callend', json);
	//var json = JSON.parse('{"type":"logcall", "endtime" : "' + _endTime + '" }');
	//console.log("Json " + json);
	uh.utilityActionController('callend', json); 

}
/*
//
////////////////////////////////////
var prevWindowId;
function sendCallLogNotes(value, notes, endTime) {

	chrome.storage.local.get(['noteWinId'], function (result) {
		if (bckgdebug == 1) { console.log ("PreviousWindowId: " + prevWindowId + " | actual: " + result.noteWinId); }

		if (result.noteWinId != prevWindowId)
		{
			bg.setWrapUpValue(value);
			bg.setNoteValue(notes);
			console.log("Call Notes " + notes);
			var json = JSON.parse('{"type":"logcall", "endtime" : "' + endTime + '" }');
			bg.utilityActionController('callend', json);
		}
		prevWindowId = result.noteWinId;
	});
}
*/
