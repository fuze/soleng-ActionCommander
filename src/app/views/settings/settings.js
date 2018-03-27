const { ipcRenderer, remote } = require("electron");
const settings = remote.require("electron-settings");
const { TriggerRow } = require("./TriggerRow");

const cancelButton = document.getElementById("cancle-button");
const saveButton = document.getElementById("save-button");
const addTriggerButton = document.getElementById("add-trigger");
const generalSettings = document.getElementById("general-settings");
const triggerPane = document.getElementById("trigger-list");

function addTriggerRow(values) {
  if (values === undefined) {
    values = { stateChange: "to", presenceValue: "busy", cmd: undefined };
  }
  const triggerRow = new TriggerRow(values);
  triggerPane.appendChild(triggerRow.createElement);
}

function removeTriggerRow(buttonElement) {
  let row = buttonElement.parentElement;
  row.parentElement.removeChild(row);
  return null;
}

function getTriggerList() {
  const triggerList = [];
  const rowList = triggerPane.children;
  for (let i = 0; i < rowList.length; i++) {
    const thisRow = rowList.item(i);
    const triggerObject = {};
    triggerObject.stateChange = thisRow.querySelector(".stateChange").value;
    triggerObject.presenceValue = thisRow.querySelector(".presenceValue").value;
    triggerObject.cmd = thisRow.querySelector(".cmd").value;
    if (triggerObject.cmd) {
      triggerList.push(triggerObject);
    }
  }
  return triggerList;
}

function loadTriggerList(triggerPane) {
  const triggerList = settings.get("appSettings.triggers", []); //get the list of triggers that are saved. If the setting does not exist, initize an array
  for (i in triggerList) {
    addTriggerRow(triggerList[i]);
  }
  if (triggerList.length == 0) {
    addTriggerRow();
  }
}

function cancel() {
  ipcRenderer.send("close-settings");
}

function saveSettings() {
  const triggerList = getTriggerList();
  const triggerOnStartup = document.getElementById("trigger-on-startup").checked;
  settings.set("appSettings.triggers", triggerList);
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
addTriggerButton.addEventListener("click", addTriggerRow);

createGeneralSettings(generalSettings);
loadTriggerList(triggerPane);
