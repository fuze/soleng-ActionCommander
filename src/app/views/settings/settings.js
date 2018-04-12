const { ipcRenderer, remote } = require("electron");
//const settings = remote.require("electron-settings");
const settings = require('electron').remote.require('electron-settings')
const { PresenceTriggerRow, CallEventTriggerRow } = require("./TriggerRow");

const cancelButton = document.getElementById("cancel-button");
const saveButton = document.getElementById("save-button");
const addPresenceTriggerButton = document.getElementById("add-presence-trigger");
const addCallEventTriggerButton = document.getElementById("add-call-event-trigger");
const generalSettings = document.getElementById("general-settings");
const presenceTriggerPane = document.getElementById("presence-trigger-list");
const callEventTriggerPane = document.getElementById("call-event-trigger-list");

function addPresenceTriggerRow(values) {
  if (values === undefined) {
    values = { stateChange: "to", presenceValue: "busy", cmd: undefined };
  }
  const triggerRow = new PresenceTriggerRow(values);
  presenceTriggerPane.appendChild(triggerRow.createElement);
}

function addCallEventTriggerRow(values) {
  if (values === undefined) {
    values = { callEvnet: "bing", cmd: undefined };
  }
  const triggerRow = new CallEventTriggerRow(values);
  callEventTriggerPane.appendChild(triggerRow.createElement);
}

function getPresenceTriggerList() {
  const triggerList = [];
  const rowList = presenceTriggerPane.children;
  for (let i = 0; i < rowList.length; i++) {
    const thisRow = rowList.item(i);
    const triggerObject = {};
    triggerObject.stateChange = thisRow.querySelector(".stateChange").value;
    triggerObject.presenceValue = thisRow.querySelector(".presenceValue").value;
    triggerObject.cmd = thisRow.querySelector(".cmd").value;
    if (triggerObject.cmd && typeof triggerObject.cmd == "string" && triggerObject.cmd.length > 0) {
      triggerList.push(triggerObject);
    }
  }
  return triggerList;
}

function getCallEventTriggerList() {
  const triggerList = [];
  const rowList = callEventTriggerPane.children;
  for (let i = 0; i < rowList.length; i++) {
    const thisRow = rowList.item(i);
    const triggerObject = {};
    triggerObject.callEvent = thisRow.querySelector(".callEvent").value;
    triggerObject.cmd = thisRow.querySelector(".cmd").value;
    if (triggerObject.cmd && typeof triggerObject.cmd == "string" && triggerObject.cmd.length > 0) {
      triggerList.push(triggerObject);
    }
  }
  return triggerList;
}

function loadTriggerList(triggerPane) {
  const presenceTriggerList = settings.get("appSettings.triggers.presenceTriggers", []); //get the list of triggers that are saved. If the setting does not exist, initize an array
  const callEventTriggerList = settings.get("appSettings.triggers.callEventTriggers", []);
  for (trigger of presenceTriggerList) {
    addPresenceTriggerRow(trigger);
  }
  if (presenceTriggerList.length == 0) { //if there are no triggers, spawn a blank one to invite the user
    addPresenceTriggerRow();
  }
  for (trigger of callEventTriggerList){
    addCallEventTriggerRow(trigger);
  }
  if (callEventTriggerList.length == 0) { //if there are no triggers, spawn a blank one to invite the user
    addCallEventTriggerRow();
  }
}

function cancel() {
  ipcRenderer.send("close-settings");
}

function saveSettings() {
  const triggerOnStartup = document.getElementById("trigger-on-startup").checked;
  const presenceTriggerList = getPresenceTriggerList();
  const callEventTriggerList = getCallEventTriggerList();
  settings.set("appSettings.triggers.presenceTriggers", presenceTriggerList);
  settings.set("appSettings.triggers.callEventTriggers", callEventTriggerList);
  settings.set("appSettings.triggerOnStartup", triggerOnStartup);

  ipcRenderer.send("close-settings");
}

function createGeneralSettings(settingsPane) {
  const triggerOnStartup = document.createElement("input");
  const label = document.createElement("label");

  triggerOnStartup.id = "trigger-on-startup";
  triggerOnStartup.type = "checkbox";
  triggerOnStartup.checked = settings.get(
    "appSettings.triggerOnStartup",
    false
  ); //read the saved value. Default to false

  label.for = "trigger-on-startup";
  label.innerHTML = "Proccess triggers on startup";

  settingsPane.appendChild(triggerOnStartup);
  settingsPane.appendChild(label);
}

cancelButton.addEventListener("click", cancel);
saveButton.addEventListener("click", saveSettings);
addPresenceTriggerButton.addEventListener("click", addPresenceTriggerRow);
addCallEventTriggerButton.addEventListener("click", addCallEventTriggerRow);

createGeneralSettings(generalSettings);
loadTriggerList();
