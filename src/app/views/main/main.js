const { ipcRenderer } = require('electron');
const settings = require("electron-settings");
const { PresenceWatcher, PresenceUpdateRate, CallEventsWatcher } = require('soleng-presence-client');
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

ipcRenderer.on('contents-loaded', (event, data) => {
  let configuration = pushDataToConfObject(cjson, data);

  const presenceWatcher = new PresenceWatcher(cjson, PresenceUpdateRate);
  presenceWatcher.start(handlePresenceUpdate);

  const callEventsWatcher = new CallEventsWatcher(cjson);
  callEventsWatcher.start(handleCallUpdate);
});

