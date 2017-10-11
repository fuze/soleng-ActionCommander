'use strict'
var bg = chrome.extension.getBackgroundPage();
var _Settings = bg.getSettings();

var _method; // = bg.getWrapUpCode();
var _intAccount; // = getCallNotes();

var method_div		= document.getElementById('method-div');
var method			= document.getElementById('method');
var int_account_div	= document.getElementById('international-account-div');
var int_account		= document.getElementById('international-account')
var create 			= document.getElementById('create');

console.log("imb.focusvisionOpportunity.js");

$(document).ready(function(){
	_method = "Qual,Quant,Qual & Quant";
	_intAccount = "Decipher,Decrypt,FV_BR,FV_CN,FV_SG,FV_UK,FV_US,IMS_AU,Kinesis_UK,Kinesis_US,REV_US";
	
	setStartState();
});

//////////////////////////////////////////////////////////////////////////////////////////
function setStartState() {
	
	if(typeof _method == 'string') {
		console.log("_method == " + _method);
		var array = new Array();
		array = _method.split(",");
		for (var i in array) {
			var optn = document.createElement("OPTION");
			optn.text = array[i];
    		optn.value = array[i];
			console.log("Value == " + array[i]);
			method.options.add(optn);
		}
	} else {
		method_div.parentNode.removeChild(method_div);
		method_div.style.visibility	= 'hidden';
	}

	if(typeof _intAccount == 'string') {
		console.log("_intAccount == " + _intAccount);
		var array = new Array();
		array = _intAccount.split(",");
		for (var i in array) {
			var optn = document.createElement("OPTION");
			optn.text = array[i];
			optn.value = array[i];
			console.log("Value == " + array[i]);
			int_account.options.add(optn);
		}
	} else {
		int_account_div.parentNode.removeChild(int_account_div);
		int_account_div.style.visibility	= 'hidden';
	}

}

//////////////////////////////////////////////////////////////////////////////////////////
create.onclick = function() {
	console.log("Create Button method=" + method.value + " int_account=" + int_account.value);

	//create.disabled = true;
	bg.sfdc__searchForAccount(method.value, int_account.value);
	bg.closeFVNoteWindow('button');

}

