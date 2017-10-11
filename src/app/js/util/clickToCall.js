'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')

const fuzeClick2CallURL = pjson.config.fuzeClick2CallURL;

const   username = lc.getTrimmedUsername();
const 	password = lc.getPassword();
////////////////////////////////////////////////////////////////////////////////////////
exports.clickToCall = function(phone) {

	var url = fuzeClick2CallURL +  'userId=' + username + '&extension=' + encodeURIComponent('+' + phone);

	console.log("clickToCall: " + url);
	console.log("clickToCall: " + username);
	console.log("clickToCall: " + password );
	
	var xhr = new XMLHttpRequest();
                                                               
    xhr.open('POST', url, true);
    xhr.setRequestHeader("username",  username ); 
    xhr.setRequestHeader("password",  password );

    xhr.setRequestHeader("cache-control", "no-cache");   
    xhr.onreadystatechange = function() {
    	if (xhr.readyState == 4) {
    		if ( xhr.status == 200 ) { 
    		
    			console.log("clickToCall: resp.success == " + xhr.responseText);
    			console.log("clickToCall: xhr.status = " + xhr.status); 
				
      		} else { 
      	
      			console.log("clickToCall: xhr.responseText = " + xhr.responseText);
    			console.log("clickToCall: xhr.status = " + xhr.status); 
      		}
      	}  
  	}; 
	xhr.send();
}

