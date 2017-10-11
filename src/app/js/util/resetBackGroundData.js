'use strict'

const bg 	= require('../generalSetGet');
////////////////////////////////////////////////////////////////////////////////////////
exports.resetBackGroundData = function  () {
	bg.setAnchorTableData(false);
	bg.setContactLeadId(false); 
	bg.setFormattedCallID(false);
	bg.setContactLeadType(false);
	bg.setContactRole('');
	bg.setCallerName('');
	bg.setStarttime(false);
	bg.setRawStartTime(false);
	bg.setRawEndTime(false);
	bg.setRawCallId(false);
	bg.setCallDirection(false);                                                                                                                                
	bg.setActivityId(false);                                                                                                                                   
	bg.setWrapUpValue('__blank__');                                                                                                                                  
	bg.setNoteValue('__blank__');  
	bg.setHistoryFlag(true);
	bg.setIsCallAnswered(false);
	bg.setAcctConnectorID(false);
	bg.setUserConnectorAcct(false);
}

  

		
