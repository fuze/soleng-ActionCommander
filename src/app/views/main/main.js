const { ipcRenderer } = require('electron');
const settings = require("electron-settings");
const presenceClient = require('soleng-presence-client');
const cjson = require('../../../config/config.json');

const statusLabel = document.getElementById('status');

function handlePresenceUpdate(status, result) {

  //1. Check current-settings to see 
  

  if (status) {
    console.log('Received a status message ' + status);
  }

  if (result) {
    statusLabel.innerHTML = 'New status : ' + result.status.presence;
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
  presenceClient.start(configuration, handlePresenceUpdate);
});