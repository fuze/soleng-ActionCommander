'use strict'

const { remote} = require('electron');

const lc = require('../localConfigSettings');
const snowAuth 	= require('./buildServiceNowInstance');
const msdAuth 	= require('./buildMSDInstance');
const zohoAuth 	= require('./buildZoHoInstance');

////////////////////////////////////////////////////////////////////////////////////////
exports.authPasswdController = function(user, password) {

	switch (lc.getCEType()) {
    case 'dynamicscrmadfs' :
    	msdAuth.buildMSDInstance(user, password, function() {
    		var thisWindow = remote.getCurrentWindow();
    		thisWindow.close();
    	});
    	break;
    case 'zohocrm' :
		zohoAuth.buildZoHoInstance(user, password, function() {
   			var thisWindow = remote.getCurrentWindow();
			thisWindow.close();
    	});
    	break;
    case 'servicenow' :
    	snowAuth.buildServiceNowInstance(user, password, function() {
    		var thisWindow = remote.getCurrentWindow();
    		thisWindow.close();
    	});
    	break;
    default :
    	return 'Unknown Connector';
    	break;
    }
}