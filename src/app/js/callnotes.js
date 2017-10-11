'use strict'


var _wrapUpCodes; // = bg.getWrapUpCode();
var _callNotes; // = getCallNotes();
var _endTime;

var wrapup_code_div		= document.getElementById('wrapup-code-div');
var wrapup_code			= document.getElementById('wrapup-code');
var wrapup_notes_div	= document.getElementById('wrapup-notes-div');
var wrapup_notes		= document.getElementById('wrapup-notes')
var save 				= document.getElementById('save');

console.log("wrapupNotes.js");

ipcRenderer.on('utility-loaded', (event, arg) => {
  console.info("wrapupNotes") 
	_wrapUpCodes = lc.getWrapUpCode();
	_callNotes = lc.getCallNotes();
	_endTime = Date.now();
	
	console.log("imb.wrapupNotes.js  getWrapUpCode == " + lc.getWrapUpCode());
	console.log("imb.wrapupNotes.js  getCallNotes == " + lc.getCallNotes());
	console.log("imb.wrapupNotes.js  myParam == " + _endTime);
	
	setInitialState();
	
	var thisWindow = remote.getCurrentWindow();
    thisWindow.focus()
});

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
