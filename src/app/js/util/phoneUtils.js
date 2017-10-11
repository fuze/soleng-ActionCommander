'use strict'

const phoneLib = require('libphonenumber-node');
const lc = require('../localConfigSettings');


	


function phoneUtils() {};

var phoneNumberPattern = JSON.parse(
	'{ 	"International" : "global", "InternationalRaw" : "e164", "National" : "local", "NationalRaw" : "e164" }');

////////////////////////////////////////////////////////////////////////////////////////
// getPhonePatterns
// return the formatted caller ID Number
// * This needs to be rewritten using Google's libphone
//===================================================================================//
phoneUtils.prototype.getPhonePatterns = function() {
	return phoneNumberPattern;
}

////////////////////////////////////////////////////////////////////////////////////////
// getPhoneNumberE164Format
// return the formatted caller ID Number
// * This needs to be rewritten using Google's libphone
//===================================================================================//
phoneUtils.prototype.getPhoneNumberPattern = function(rawphone, pattern){
	var callid = false;

	if (rawphone != false) {
		var extractLocale = function (lang) {
			if (lang !== null && lang.indexOf("-") !== -1) {
				return lang.split("-")[1];
			}

			return lang;
		};
		
		var navigatorLanguage = (window.navigator.userLanguage || window.navigator.language);
		var browserLang = extractLocale(navigatorLanguage);
		
console.debug("navigatorLanguage == " + navigatorLanguage);
console.debug("browserLang == " + browserLang);
	
		var number = phoneLib.format(rawphone, browserLang);
console.debug("number == " + JSON.stringify(number));
		if (phoneLib.isValid(number)) {
			//var phoneNumber = phoneLib.parse(rawphone);
			//var countryCode = phoneNumber.getCountryCode();
			
			switch(pattern) {
				case phoneNumberPattern.International:
					callid = phoneLib.format(number, phoneNumberPattern.International);
                    callid = callid.replace(/\+/g,'');
                    break;
				case phoneNumberPattern.InternationalRaw:
					callid = phoneLib.format(number, phoneNumberPattern.InternationalRaw);
					callid = callid.replace(/\D/g,'');
					break;
				case phoneNumberPattern.National:
					callid = phoneLib.format(number, phoneNumberPattern.National);
                    callid = callid.replace(/\+/g,'');
                    break;
				case phoneNumberPattern.NationalRaw:
					callid = phoneLib.format(number, phoneNumberPattern.NationalRaw);
					callid = callid.replace(/\D/g,'');
					break;
			}
		}
	}
	
	return callid;
}

phoneUtils.prototype.getPhoneNumberForUI = function(rawphone) {
	var callid = false;
	console.debug("rawphone == " + rawphone);
	console.debug("COUNTRY == " + phoneLib.format(rawphone, 'global'));
	if (rawphone != false) {
		switch(lc.getPhonePattern()) {
			case "International":
				callid = phoneLib.format(rawphone, phoneNumberPattern.International);
				//callid = callid.replace(/\+/g,'');
				break;
			case "National":
				callid = phoneLib.format(rawphone, phoneNumberPattern.National);
				//callid = '1 ' + callid
				break;
		}
	}
	console.debug("getPhoneNumberForUI  == " + callid);
	return callid;

}

phoneUtils.prototype.getFormattedPhoneNumber = function(rawphone) {
	var callid = false;

	if (rawphone != false) {
		console.log("getFormattedPhoneNumber: " + rawphone);
		if (rawphone.length > 10) {
			callid = rawphone.substring(rawphone.length - 10);
		} else if (rawphone.length == 10) {
			callid = rawphone;
		}
		if (callid) {
	 		callid = '(' + callid.substring(0,3) + ') ' + callid.substring(3,6) + '-' + callid.substring(6,10);
	 	} else {
	 		callid = rawphone;
	 	}
	 	console.log("getFormattedPhoneNumber: " + callid);
	 }
	 return callid;
}


module.exports = new phoneUtils();
