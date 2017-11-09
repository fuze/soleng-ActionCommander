'use strict'

const { remote } = require('electron');
const pjson = remote.getGlobal('pjson')
const setCall = require('./util/setCallData');



//Custom
const vTiger 		= require('./custom/vTigerDataCalls');
//const epsGet 	 	= require('./custom/epsilon_sfdc_GetDataCalls');
//const jgGet			= require('./custom/justGiving_zendesk_GetDataCalls');
//const pgaGer	 	= require('./custom/pgaTour_sfdc_GetDataCalls');
//const usautoGet		= require('./custom/usauto_sfdc_GetDataCalls');


//HelpDesk
const sCldGet	= require('./helpdesk/sfdcservicecloud_GetDataCalls');
const snowGet 	= require('./helpdesk/servicenow_GetDataCalls');
const zenGet 	= require('./helpdesk/zendesk_GetDataCalls');

//CRM 
const bullGet 		= require('./crm/bullhorn_GetDataCalls');
const msdGet 		= require('./crm/msdynamics_GetDataCalls');
const sfdcGet 		= require('./crm/sfdc_GetDataCalls');
const zohoGet 		= require('./crm/zoho_GetDataCalls');
const netsuiteGet	= require('./crm/netsuite_GetDataCalls');


function callHandler() {};
///////////////////////////////////////////////////////////////
callHandler.prototype.callActionController = function (action, callData) {
	
	setCall.setCallData(callData.callstate, callData);
	
	console.warn("workFlowController:Route Path " + pjson.config.userData.routepath);
	console.warn("workFlowController:CallData" + JSON.stringify(callData, null,2));
	var crmPath = pjson.config.userData.routepath;

	if (action == 'call') {
		console.log("workFlowController: Call Data \n" + JSON.stringify(callData) + "\n");
		switch(pjson.config.userData.routepath) {
			case 'vtiger' :
				console.log("CALL routePath == "+ pjson.config.userData.routepath + " " + action + " " + JSON.stringify(callData));
				vTiger.vtiger_callHandler(callData.callstate, callData);
				break;
			case 'helpdesk' :
				console.log("CALL routePath == "+ pjson.config.userData.routepath + " " + pjson.config.userData.ce_type + " " + action + " " + JSON.stringify(callData));
				helpdeskCallRouter(action, callData)
				break;
			case 'crm' :
				console.log("CALL routePath == "+  pjson.config.userData.routepath + " " +  pjson.config.userData.ce_type + " " + action + " " + JSON.stringify(callData));
				crmCallRouter(action, callData)
				break;
			case 'usauto' :
				console.log("CALL routePath == "+ pjson.config.userData.routepath + " " + pjson.config.userData.ce_type + " " + action + " " + JSON.stringify(callData));
				crmCallRouter(action, callData);
				break;
			case 'epsilon' :
				console.log("CALL routePath == "+ pjson.config.userData.routepath + " " + pjson.config.userData.ce_type + " " + action + " " + JSON.stringify(callData));
				crmCallRouter(action, callData);
				break;
			default:
				console.log("CALL routePath == default");
				break;
		}
	}
}

///////////////////////////////////////////////////////////////
function helpdeskCallRouter(action, callData) {
console.log("helpdeskCallRouter == ce_type " + pjson.config.userData.ce_type  );
console.log("helpdeskCallRouter == callstate " + callData.callstate  );
	if (pjson.config.userData.ce_type == 'sfdcservicecloud') {
		sCldGet.sfdcservicecloud__callHandler(callData.callstate, callData);
	} else if (pjson.config.userData.ce_type == 'servicenow') {
		snowGet.servicenow__callHandler(callData.callstate, callData);
	} else if (pjson.config.userData.ce_type == 'zendesk') {
		if ( lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'JustGiving') {
		console.log("helpdeskCallRouter == " + lc.getCrmType());
			jgGet.justGiving__callHandler(callData.callstate, callData);
		} else {
			zenGet.zendesk__callHandler(callData.callstate, callData);
		}
	}
}

///////////////////////////////////////////////////////////////
function crmCallRouter(action, callData) {
	if (pjson.config.userData.routepath == 'usauto') {
		usautoGet.usauto__sfdc__callHandler(callData.callstate, callData);
	} else if (pjson.config.userData.ce_type == 'sfdc') {
		if ( pjson.config.userData.ce_type == "Custom" && bg.getCrmJSPackage() == 'PgaTour') {
			pgaGet.pgaTour__callHandler(callData.callstate, callData);
		} else if ( pjson.config.userData.ce_type == "Custom" && bg.getCrmJSPackage() == 'epsilon') {
			epsGet.epsilon__sfdc__callHandler(callData.callstate, callData);
		} else if ( pjson.config.userData.ce_type == "Custom" && bg.getCrmJSPackage() == 'epsilon') {
			usautoGet.usauto__sfdc__callHandler(callData.callstate, callData);
		} else {
			sfdcGet.sfdc__callHandler(callData.callstate, callData);
		}
	} else if (pjson.config.userData.ce_type == 'zohocrm') {
		zohoGet.zoho__callHandler(callData.callstate, callData);
	} else  if (pjson.config.userData.ce_type == 'dynamicscrmadfs') {
		msdGet.msdynamics__callHandler(callData.callstate, callData);
	} else if (pjson.config.userData.ce_type == 'bullhorn') {
		bullGet.bullhorn__callHandler(callData.callstate, callData);
	} else if (pjson.config.userData.ce_type == 'netsuitecrmv2') {
		netsuiteGet.netsuite__callHandler(callData.callstate, callData);
	}

}
module.exports = new callHandler();
