'use strict'

const { remote, shell, ipcRenderer } = require('electron');
const pjson = remote.getGlobal('pjson')

const ch = require('./util/callHistory')
//Custom
const epsPost 	 	= require('./custom/epsilon_sfdc_PostDataCalls');
const jgPost		= require('./custom/justGiving_zendesk_PostDataCalls');
const pgaPost	 	= require('./custom/pgaTour_sfdc_PostDataCalls');
const usautoPost	= require('./custom/usauto_sfdc_PostDataCalls');

//HelpDesk
const sCldPost		= require('./helpdesk/sfdcservicecloud_PostDataCalls')
const snowPost 		= require('./helpdesk/servicenow_PostDataCalls')
const zenPost 		= require('./helpdesk/zendesk_PostDataCalls')

//CRM 
const bullPost 		= require('./crm/bullhorn_PostDataCalls')
const msdPost 		= require('./crm/msdynamics_PostDataCalls')
const sfdcPost 		= require('./crm/sfdc_PostDataCalls')
const zohoPost 		= require('./crm/zoho_PostDataCalls')

function utilityHandler() {};

///////////////////////////////////////////////////////////////
utilityHandler.prototype.utilityActionController = function(action, clickdata) {
//exports.utilityActionController = function(action, clickdata) {

	console.debug("utilityController: Action == " + action + " Call Data \n" + JSON.stringify(clickdata) + "\n");
	var crmPath = lc.getRoutePath();
	if (action == 'create' || action == 'callend') {
		console.debug("clickActionController: Call Data \n" + JSON.stringify(clickdata) + "\n");
		
		if(clickdata.type == 'postNote') {
			var newjson = JSON.parse('{"type":"saveNotes", "endtime" : "' + Date.now() + '" }');
			this.utilityActionController('callend', newjson);
		} else {
			utilityActionRouter(action, clickdata);
		}
			 
	}  else if (action == 'openwindow') {

		if (clickdata.type == 'contacts') {
			contactsOpenWindow('Contact', clickdata.uid);
		} else if (clickdata.type == 'accounts') {
			accountsOpenWindow('Account', clickdata.acctid);
		} else if (clickdata.type == 'incident') {
			bg.setActivityId(clickdata.ticketid);
			incidentsOpenWindow('Incident', clickdata.ticketid);
		} else if (clickdata.type == 'activities') {
			bg.setActivityId(clickdata.contentid);
			activityOpenWindow('Activity', clickdata.contentid, clickdata.subtype);
		} else if (clickdata.type == 'opportunities') {
			bg.setActivityId(clickdata.contentid);
			opportunityOpenWindow('Opportunity', clickdata.contentid);
		} else if (clickdata.type == 'tasks') {
			bg.setActivityId(clickdata.contentid);
			activityOpenWindow('Tasks', clickdata.contentid, clickdata.subtype);
		} else if (clickdata.type == 'sales-up') {
			bg.setActivityId(clickdata.contentid);
			opportunityOpenWindow('Opportunity', clickdata.contentid);
		} else if (clickdata.type == 'job-orders') {
			bg.setActivityId(clickdata.contentid);
			jobOpenWindow('JobOrder', clickdata.contentid);
		} else if (clickdata.type == 'candidates') {
			bg.setActivityId(clickdata.uid);
			candidatesOpenWindow('Candidates', clickdata.uid);
		} else if (clickdata.type == 'placement') {
			bg.setActivityId(clickdata.uid);
			placementsOpenWindow('Placement', clickdata.uid);
		} else if (clickdata.type == 'leads') {
			bg.setActivityId(clickdata.uid);
			leadsOpenWindow('Leads', clickdata.uid);
		} else if (clickdata.type == 'reservation') {
			bg.setActivityId(clickdata.contentid);
			reservationOpenWindow('Reservation', clickdata.contentid);	
		} else {
			title = '';
		}
	} else if (action == 'clicktocall') {
		console.debug("utilityActionController: Action == " + action + " " + JSON.stringify(clickdata, null, 2));
		ctc.clickToCall(clickdata.phone);
	} 

};


///////////////////////////////////////////////////////////////
// contactsOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function contactsOpenWindow(title, idforwin) {

	if ((lc.getCEType() == 'sfdcservicecloud') || (lc.getCEType() == 'sfdc')) {
		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'servicenow') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/nav_to.do?uri=sys_user.do?sys_id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/nav_to.do?uri=sys_user.do?sys_id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'zendesk') {

		console.debug("openwindow == " +lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/agent/users/' + idforwin;
		shell.openExternal(openwinurl)

	} else if (lc.getCEType() == 'zohocrm') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Contacts&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Contacts&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'dynamicscrmadfs') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=contact&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=contact&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	} else if (lc.getCEType() == 'bullhorn') {

		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=ClientContact&id=' + idforwin + '&view=Overview');
		bg.setContactLeadId(idforwin);
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=ClientContact&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}
///////////////////////////////////////////////////////////////
// incidentsOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function incidentsOpenWindow (title, idforwin) {
	if (lc.getCEType() == 'sfdcservicecloud') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'servicenow') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/nav_to.do?uri=incident.do?sys_id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/nav_to.do?uri=incident.do?sys_id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'zendesk') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/agent/tickets/' + idforwin;
		console.debug("openwindow == " + openwinurl );
		shell.openExternal(openwinurl);
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	}
}

///////////////////////////////////////////////////////////////
// accountsOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function accountsOpenWindow(title, idforwin) {
	if ((lc.getCEType() == 'sfdcservicecloud') || (lc.getCEType() == 'sfdc')) {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title);
		//new_window.focus();

	} else if (lc.getCEType() == 'servicenow') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/nav_to.do?uri=core_company.do?sys_id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/nav_to.do?uri=core_company.do?sys_id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'zendesk') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/agent/organizations/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'zohocrm') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Accounts&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Accounts&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'dynamicscrmadfs') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=account&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=account&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	} else if (lc.getCEType() == 'bullhorn') {

		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=ClientCorporation&id=' + idforwin + '&view=Overview');
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=ClientCorporation&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}

///////////////////////////////////////////////////////////////
// activityOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function activityOpenWindow(title, idforwin, subtype) {
	if (lc.getCEType() == 'sfdc') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'dynamicscrmadfs') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=' + subtype + '&id=' + idforwin);
		var openwinurl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=' + subtype + '&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	} else if (lc.getCEType() == 'zohocrm') {

		console.log("openwindow == " + lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Calls&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Calls&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}

///////////////////////////////////////////////////////////////
// opportunityOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function opportunityOpenWindow(title, idforwin) {
	if (lc.getCEType() == 'sfdc') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'zohocrm') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Potentials&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/crm/EntityInfo.do?module=Potentials&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();

	} else if (lc.getCEType() == 'dynamicscrmadfs') {

		console.debug("openwindow == " + lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=opportunity&id=' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/main.aspx?pagetype=entityrecord&etn=opportunity&id=' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	} else if (lc.getCEType() == 'bullhorn') {
		//https://www.bullhornstaffing.com/BullhornStaffing/OpenWindow.cfm?entity=Candidate&id=506271&view=Overview
		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Opportunity&id=' + idforwin + '&view=Overview');
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Opportunity&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}
///////////////////////////////////////////////////////////////
// jobOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function jobOpenWindow(title, idforwin) {
	if (lc.getCEType() == 'bullhorn') {
		//https://www.bullhornstaffing.com/BullhornStaffing/OpenWindow.cfm?entity=Candidate&id=506271&view=Overview
		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=JobOrder&id=' + idforwin + '&view=Overview');
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=JobOrder&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}
///////////////////////////////////////////////////////////////
// candidatesOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function candidatesOpenWindow(title, idforwin) {

	if (lc.getCEType() == 'bullhorn') {

		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Candidate&id=' + idforwin + '&view=Overview');
		bg.setContactLeadId(idforwin);
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Candidate&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}

///////////////////////////////////////////////////////////////
// placementsOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function placementsOpenWindow(title, idforwin) {

	if (lc.getCEType() == 'bullhorn') {
	
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Placement&view=Add';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}
///////////////////////////////////////////////////////////////
function leadsOpenWindow(title, idforwin) {

	if (lc.getCEType() == 'bullhorn') {
		console.log("openwindow == " + lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Lead&id=' + idforwin + '&view=Overview');
		var openwinurl = lc.getCrmBaseUrl() + '/BullhornStaffing/OpenWindow.cfm?entity=Lead&id=' + idforwin + '&view=Overview';
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}
///////////////////////////////////////////////////////////////
// reservationOpenWindow
// @ title == is the Window Title
// @ idforwin == is the ID of the content
///////////////////////////////////////////////////////////////
function reservationOpenWindow(title, idforwin) {
	if (lc.getCEType() == 'sfdc' && lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'PgaTour') {
		console.log("openwindow == " + lc.getCrmBaseUrl() + '/' + idforwin );
		var openwinurl = lc.getCrmBaseUrl() + '/' + idforwin;
		shell.openExternal(openwinurl)
		//var new_window = window.open(openwinurl, title + idforwin);
		//new_window.focus();
	}
}

///////////////////////////////////////////////////////////////
// utilityActionRouter
// @ action == is the Window Title
// @ clickdata == is the ID of the content
///////////////////////////////////////////////////////////////
function utilityActionRouter(action, clickdata) {

	switch (lc.getRoutePath()) {
		case 'helpdesk' :
			console.log("CLICK routePath == " + lc.getRoutePath() + " " + action + " " + JSON.stringify(clickdata));
			helpdeskactionRouter(action, clickdata);
			break;
		case 'crm' :
			console.log("CLICK routePath == " + lc.getRoutePath() + " " + action + " " + JSON.stringify(clickdata));
			crmactionRouter(action, clickdata);
			break;
		case 'usauto' :
			console.log("CLICK routePath == " + lc.getRoutePath() + " " + action + " " + JSON.stringify(clickdata));
			crmactionRouter(action, clickdata);
			break;
		case 'epsilon' :
			console.log("CLICK routePath == " + lc.getRoutePath() + " " + action + " " + JSON.stringify(clickdata));
			crmactionRouter(action, clickdata);
			break;
		default:
			console.log("CLICK routePath == default");
			break;
	}

}
///////////////////////////////////////////////////////////////
// helpdeskactionRouter
// @ action == is the Window Title
// @ clickdata == is the ID of the content
///////////////////////////////////////////////////////////////
function helpdeskactionRouter (action, clickdata) {
	if (lc.getCEType() == 'sfdcservicecloud') {
		sCldPost.sfdcservicecloud__actionHandler(action, clickdata);
	} else if (lc.getCEType() == 'servicenow') {
		snowPost.servicenow__actionHandler(action, clickdata);
	} else if (lc.getCEType() == 'zendesk') {
		if (lc.getCrmType() == 'Custom' && lc.getCrmJSPackage() == 'JustGiving') {
			jgPost.justGiving__callHandler(action, clickdata);
		} else {
			zenPost.zendesk__actionHandler(action, clickdata);
		}
	}
}

///////////////////////////////////////////////////////////////
// helpdeskactionRouter
// @ action == is the Window Title
// @ clickdata == is the ID of the content
///////////////////////////////////////////////////////////////
function crmactionRouter(action, clickdata) {
console.log("crmactionRouter: " + lc.getRoutePath());

	if (lc.getRoutePath() == 'usauto') {
		usautoPost.usauto__sfdc__actionHandler(action, clickdata);
	} else if (lc.getRoutePath() == 'epsilon') {
		epsPost.epslion__sfdc__actionHandler(action, clickdata);
	} else if (lc.getCEType() == 'sfdc') {
		if ( lc.getCrmType() == "Custom" && lc.getCrmJSPackage() == 'PgaTour') {
			pgaPost.pgaTour__actionHandler(action, clickdata);
		} else {
			sfdcPost.sfdc__actionHandler(action, clickdata);
		}
	} else if (lc.getCEType() == 'zohocrm') {
		zohoPost.zoho__actionHandler(action, clickdata);
	} else if (lc.getCEType() == 'dynamicscrmadfs') {
		msdPost.msdynamics__actionHandler(action, clickdata);
	} else if (lc.getCEType() == 'bullhorn') {
		bullPost.bullhorn__actionHandler(action, clickdata);
	}

}

module.exports = new utilityHandler();
