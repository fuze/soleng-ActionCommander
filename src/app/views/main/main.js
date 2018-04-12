const { ipcRenderer } = require('electron');
//const settings = require("electron-settings");
const settings = require('electron').remote.require('electron-settings')
const { exec } = require("child_process");
const { PresenceWatcher, PresenceUpdateRate, CallEventsWatcher } = require('soleng-presence-client');
const { TriggerManager } = require('../../js/triggerManager.js')
const cjson = require('../../../config/config.json');
const statusLabel = document.getElementById('status');
const callStatusLabel = document.getElementById('call-status');
const triggerManager = new TriggerManager()

function handlePresenceUpdate(status, result) {
  if (status) {
    //console.log('Received a call event status message')
    //console.log(status);
  }

  if (result) {
    statusLabel.innerHTML = 'Presence: ' + result.status.presence;
    console.log('Received a presence result')
    console.log(result);
    triggerManager.newPresenceUpdate(result)
  }
}

function handleCallUpdate(status, result) {
  if (status) {
    //console.log('Received a presence status message')
    //console.log(status)
  }

  if (result) {
    callStatusLabel.innerHTML = 'Call Event: ' + result.status.presence;
    console.log('Received a call event result')
    console.log(result);
    triggerManager.newCallEvent(result)
  }
}

function pushDataToConfObject(confObject, authDetails) {
  confObject.username = authDetails.data.entity.origin.id;
  confObject.tenantId = authDetails.data.entity.tenantKey;
  confObject.wardenToken = authDetails.data.grant.token;

  return confObject;
}

function setUpCallEventTriggers(triggerManager, triggerList){
  for (trigger of triggerList){
    trigger.callback = (platformData)=>{exec(commandSubsitution(trigger.cmd, platformData))}
    console.log("setting up trigger: ")
    console.log(trigger)
    console.log(typeof trigger.callback)
    triggerManager.addCallEventTrigger(trigger)
  }
}

function commandSubsitution(command, platformData){
  //parses the command for data to subsitute from platformData
  //clid
  //clidname
  //etc
  return command
}

function setUpPresenceTriggers(triggerManager, triggerList){
  for (trigger of triggerList){
    trigger.callback = ()=>{exec(trigger.cmd)}
    triggerManager.addPresenceTrigger(trigger)
  }
}

ipcRenderer.on('contents-loaded', (event, data) => {
  
  setUpCallEventTriggers(triggerManager, settings.get("appSettings.triggers.callEventTriggers", []))
  setUpPresenceTriggers(triggerManager, settings.get("appSettings.triggers.presenceTriggers", []))
  settings.watch("appSettings.triggers", newTriggers => { //if the trigger settings change, clear the triggers and load the new ones
    triggerManager.clearAllTriggers()
    setUpCallEventTriggers(triggerManager, settings.get("appSettings.triggers.callEventTriggers", []))
    setUpPresenceTriggers(triggerManager, settings.get("appSettings.triggers.presenceTriggers", []))
  });


  let configuration = pushDataToConfObject(cjson, data);

  const presenceWatcher = new PresenceWatcher(cjson, PresenceUpdateRate);
  presenceWatcher.start(handlePresenceUpdate);

  const callEventsWatcher = new CallEventsWatcher(cjson);
  callEventsWatcher.start(handleCallUpdate);
});

