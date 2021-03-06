const { ipcRenderer } = require('electron');
const settings = require("electron-settings");
const { exec } = require("child_process");
const { PresenceWatcher, PresenceUpdateRate, CallEventsWatcher } = require('soleng-presence-client');
const { TriggerManager } = require('../../js/triggerManager.js')
const cjson = require('../../../config/config.json');
const statusLabel = document.getElementById('status');
const callStatusLabel = document.getElementById('call-status');

function handlePresenceUpdate(status, result) {
  if (status) {
    console.log('Received a status message ' + status);
  }

  if (result) {
    statusLabel.innerHTML = 'New status : ' + result.status.presence;
  }
}

function handleCallUpdate(status, result) {
  if (status) {
    console.log('Received a status message' + status);
  }

  if (result) {
    callStatusLabel.innerHTML = 'New status : ' + result.status.presence;
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
    triggerManager.addPresenceTrigger(trigger)
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
  const triggerManager = new TriggerManager()
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

