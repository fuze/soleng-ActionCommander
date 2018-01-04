'use strict'

const phoneLib = require('libphonenumber-node');
const lc = require('../localConfigSettings');


	


function phoneUtils() {};

var phoneNumberPattern = JSON.parse(
	'{ 	"International" : "0", "InternationalPlus" : "1", "InternationalRaw" : "2", "InternationalRawPlus" : "3", "National" : "4", "NationalRaw" : "5" }');

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
	console.log("getPhoneNumberPattern::pattern= " + pattern)
	if (rawphone != false) {
		var extractLocale = function (lang) {
			if (lang !== null && lang.indexOf("-") !== -1) {
				return lang.split("-")[1];
			}

			return lang;
		};
		
		var navigatorLanguage = (window.navigator.userLanguage || window.navigator.language);
		var browserLang = extractLocale(navigatorLanguage);
		var number = phoneLib.format(rawphone, browserLang);

		console.debug("navigatorLanguage == " + navigatorLanguage);
		console.debug("browserLang == " + browserLang);
		console.debug("number == " + JSON.stringify(number));

		if (phoneLib.isValid(number)) {

			switch(pattern) {
				case phoneNumberPattern.International:
					callid = phoneLib.format(number, "global");
                    callid = callid.replace(/\+/g,'');
                    break;
				case phoneNumberPattern.InternationalPlus:
					callid = phoneLib.format(number, "global");
					callid = "%2B" + callid.replace(/\+/g,'');
					break;
				case phoneNumberPattern.InternationalRaw:
					callid = phoneLib.format(number, "global");
					callid = callid.replace(/\D/g,'');
					break;
				case phoneNumberPattern.InternationalRawPlus:
					callid = phoneLib.format(number, "global");
					callid = "%2B" + callid.replace(/\D/g,'');
					break;
				case phoneNumberPattern.National:
					callid = phoneLib.format(number, "local");
                    callid = callid.replace(/\+/g,'');
                    break;
				case phoneNumberPattern.NationalRaw:
					callid = phoneLib.format(number, "local");
					callid = callid.replace(/\D/g,'');
					break;
			}
		}
		else
		{
			callid = rawphone;
		}
	}
	console.log("getPhoneNumberPattern::callid= " + callid)

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
	if (callid == null)
		callid = rawphone;
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
