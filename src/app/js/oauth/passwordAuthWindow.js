//var bg = chrome.extension.getBackgroundPage();
//var _Settings 				= bg.getSettings();
//var cloudElementsApiUrl 	= _Settings.cloudElementsApiUrl;
var called = 0;
////////////////////////////////////////////////////////////////////////////////////////
function passwordAuthWindow(end) {
	if (called == 0) {
		called += 1;
		bg.showPasswdPage('/html/passwdAuth.html?'+ end);
	}
}
