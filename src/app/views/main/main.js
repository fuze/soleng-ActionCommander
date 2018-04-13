const { ipcRenderer } = require('electron');
//const settings = require("electron-settings");
const settings = require('electron').remote.require('electron-settings')
const { exec } = require("child_process");
const { PresenceWatcher, PresenceUpdateRate, CallEventsWatcher } = require('soleng-presence-client');
const { TriggerManager } = require('../../js/triggerManager.js')
const cjson = require('../../../config/config.json');


const triggerManager = new TriggerManager()

function handlePresenceUpdate(status, result) {
  if (status) {
    //console.log('Received a call event status message')
    //console.log(status);
  }

  if (result) {
    console.log('Received a presence result')
    console.log(result.status.platformData);
    const presenceElement = document.getElementById('presence-status');
    const tagsElement = document.getElementById('presence-tags');
    presenceElement.innerHTML = result.status.presence;
    let tags = result.status.platformData.data.tags;
    if (tags.length == 0){tags = "none"}
    tagsElement.innerHTML = tags

    triggerManager.newPresenceUpdate(result)
  }
}

function handleCallUpdate(status, result) {
  if (status) {
    //console.log('Received a presence status message')
    //console.log(status)
  }

  if (result) {
    const callEventElement0 = document.getElementById('call-event-0');
    const callEventElement1 = document.getElementById('call-event-1');
    const callEventElement2 = document.getElementById('call-event-2');
    callEventElement2.innerHTML = callEventElement1.innerHTML
    callEventElement1.innerHTML = callEventElement0.innerHTML
    callEventElement0.innerHTML = result.status.presence
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
    triggerManager.addCallEventTrigger(trigger)
  }
}

function commandSubsitution(command, platformData){
  //parses the command for data to subsitute from platformData
  const keys = [
    "callid",
    "clid",
    "clidname",
    "destnumber",
    "direction",
    "duration",
    "inConfrence",
    "userId",
    "ThinkingId"
    ]
  for (key of keys){
    command = stringReplacer(command, "{" + key + "}", platformData[key])
  }
  return command
}

function stringReplacer(string, key, value){
  let regex = new RegExp(key, 'g')
  return string.replace(regex, value)
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

