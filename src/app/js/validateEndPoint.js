'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const vTiger = require('./custom/vTigerDataCalls')
const bg = require('./generalSetGet')
const lc 	= require('./localConfigSettings');

const cloudElementsUrl = pjson.config.cloudElementsUrl


///////////////////////////////////////////////////////////////
exports.validateEndPoint = function(callback) {

	if (lc.getRoutePath() == 'vtiger') {
		vTiger.vtiger_Validate(callback);
	} else {
	
		var url = cloudElementsUrl +  '/' + lc.getRoutePath();
	    	url += '/ping';
	    
		console.debug("validateEndPoint: " + JSON.stringify(pjson, null, 2));    
		var header = lc.getCloudElementsId();
		console.debug("validateEndPoint: " + url);
		console.debug("validateEndPoint: " + header);
	
		var xhr = new XMLHttpRequest();
		xhr.withCredentials = true;                                                                  
   		xhr.open('GET', url, true);
    	xhr.setRequestHeader("Authorization",  header ); 
    	xhr.setRequestHeader("cache-control", "no-cache");   
    	xhr.onreadystatechange = function() {
    		if (xhr.readyState == 4) {
    			if ( xhr.status == 200 ) { 
    				console.log("validateEndPoint: resp.success == " + xhr.responseText)
					var resp = JSON.parse( xhr.responseText );
    				if ( typeof resp.endpoint == 'string' ) { 
    					console.log("helpdesk_Validate: User Validated ");
    					bg.setCrmAuthStatus(true); 
    					console.debug("validateEndPoint: User Validated getUserDataCallBack");
    					callback(JSON.parse('{"code" : 200, "action" : 3000, "event" : "end-point-validated",  "message" : "End Point Validated" }'));
    				}
    			} else if ( xhr.status == 401 ){ 
      				bg.setCrmAuthStatus(false);
      				console.debug("UN authorized");
      				console.debug("xhr.responseText = " + xhr.responseText);
    				console.debug("xhr.status = " + xhr.status); 
    				callback(JSON.parse('{"code" : 401, "action" : 3001, "event" : "end-point-invalid",  "message" : "End Not Point Validated" }'));
      			} else { 
      				console.debug("xhr.responseText = " + xhr.responseText);
    				console.debug("xhr.status = " + xhr.status);
    				callback(JSON.parse('{"code" : "' + xhr.status +'", "action" : 3002, "event" : "general-exception",  "message" : "' +xhr.responseText +'" }'));
    			}
      		
      		}  
  		} 
		xhr.send(null);
	}
}




