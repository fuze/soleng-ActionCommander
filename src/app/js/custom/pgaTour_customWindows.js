var bg = chrome.extension.getBackgroundPage();
var _Settings = bg.getSettings();


//////////////////////////////////////////////////////////////////////////////////////////
function showPgaScriptWindow(url) {

	chrome.runtime.getPlatformInfo(function(info) {
		// Display host OS in the console
		var _os = info.os;
		console.log("showPgaScriptWindow == " + JSON.stringify(info, null, 2));

		if (_os == 'mac') {
			//openPgaScriptWindow('/html/pgaScript.html?', 480, 350);
			openPgaScriptWindow(url, 600,  450);
			if (bckgdebug == 1) { console.log("showPgaScriptWindow == MAC"); }
		} else if (_os == 'win') {
			if (bckgdebug == 1) { console.log("showPgaScriptWindow == WINDOWS"); }
			//openPgaScriptWindow('/html/pgaScript.html?', 565, 455);
			openPgaScriptWindow(url, 600, 450);
		}
	});
	 console.log("showPgaScriptWindow : endstr ");
}
//////////////////////////////////////////////////////////////////////////////////////////
// Opens a popup dialog centred to the screen.
function openPgaScriptWindow(url, width, height) {
	console.log("openPgaScriptWindow");
	var id;
	chrome.windows.create({
		url: url, type: 'popup',
		width: width, height: height, left: 20, top: 20
	}, function() {	
		chrome.windows.getCurrent({windowTypes: ['popup'], populate: true}, function(result) {
			console.warn ("openPgaScriptWindow: A" + JSON.stringify(result));
			id = parseInt(result.id);
			console.warn ("openPgaScriptWindow AA: " + id);
			chrome.storage.local.set({ 'pgaScript': id });
  		});
  	});
}
//////////////////////////////////////////////////////////////////////////////////////////
function closePgaScriptWindow(action) {
	console.log("closePgaScriptWindow: "+ action );
	
	var id;
	chrome.storage.local.get(['pgaScript'], function (result) {
		console.warn ("closePgaScriptWindow: A " + JSON.stringify(result));
		id = result.pgaScript;
		
		if (id)  {
			console.warn ("closePgaScriptWindow: id " + id);
			try {
				if ((action == 'browser') || (action == 'button') || (action == 'setup')) { 
					chrome.windows.remove(id);
				} else if (action == id) {	
					chrome.storage.local.set({ 'pgaScript': null });
				}
				// Close the Note window too if not null
			} catch (error) { 
				console.warn("Caught Error " + error.message);
			}
  		}
	});
}