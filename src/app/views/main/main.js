//const { remote } = require('electron');
const { ipcRenderer, remote } = require('electron');
const mainWindow = remote.getGlobal('mainWindow');
//const { ipcMain } = require("electron");
//const settings = require("electron-settings");
const settings = remote.require('electron-settings')
const {Tray, Menu} = remote;
const { exec } = require("child_process");
const EventEmitter = require("events");
const cjson = require('../../../config/config.json');
const path = require("path");

//const presenceClient = require('soleng-presence-client');
const { PresenceWatcher, CallEventsWatcher } = require('soleng-presence-client');
//const presenceWatcher = new presenceClient.PresenceWatcher.PresenceWatcher(cjson, 5000);




let contents;
let currentStatus = {};
let intervals = [];
let thisWindow;
let _wardenData;

const status = document.getElementById('status');

/*
const userPresence = new Presence();

function onReady(browserWindow) {
  console.log("starting background process");

  localStorage.getItem();

  thisWindow = browserWindow;
  contents = browserWindow.webContents;
  wardenData = browserWindow.wardenData;

  setUpTriggers(settings.get("appSettings.triggers", []));
  settings.watch("appSettings.triggers", newTriggers => {
    setUpTriggers(newTriggers);
  });
}
function getPresence(callback) {
  fuzePresence.getPresence(wardenData.data.grant.token, (err, response) => {
    try {
      if (err) {
        throw "error: " + err + JSON.stringify(response);
      } else {
        sendPresenceData(response.data); //the old way
        userPresence.updatePresence(response.data);
        if (callback) {
          callback();
        }
      }
    } catch (err) {
      console.log("error getting updated presence");
      console.log(err);
    }
  });
}

function sendPresenceData(presenceData) {
  if (currentStatus.changedAt !== presenceData.changedAt) {
    currentStatus = presenceData;
    contents.send("new status", currentStatus);
  }
}

//////////////////////////////
// presence event handeling //
//////////////////////////////

class Presence extends EventEmitter {
  constructor() {
    super();
    this.state = { status: undefined, tags: undefined };
  }

  updatePresence(newState) {
    if (typeof this.state.status !== "undefined") {
      if (this.state.status != newState.status) {
        this.presenceEmitter("from", this.state.status);
        this.presenceEmitter("to", newState.status);
      }
    }
    this.state.status = newState.status;

    if (typeof this.state.tags !== "undefined") {
      this.parseTags(this.state.tags, newState.tags);
    }
    this.state.tags = newState.tags;
    return this.state;
  }
  parseTags(oldTags, newTags) {
    for (let i of oldTags) {
      if (newTags.indexOf(i) == -1) {
        this.presenceEmitter("from", i); //if the old tag is not found in newTags, emit an event for it
      }
    }
    for (let i of newTags) {
      if (oldTags.indexOf(i) == -1) {
        this.presenceEmitter("to", i); //if the new tag is not found in oldTags, emit an event for it
      }
    }
  }

  forceEmit() {
    //forces the emitting of 'to' events for the current presence. Used for proccessing startup triggers
    this.presenceEmitter("to", this.state.status);
    for (let i of this.state.tags) {
      this.presenceEmitter("to", i);
    }
  }
  presenceEmitter(direction, state) {
    this.emit("presenceUpdate", direction, state);
  }
}

function setUpTriggers(triggerList) {
  userPresence.removeAllListeners();
  for (let thisTrigger of triggerList) {
    console.log("setting up trigger:");
    console.log(thisTrigger);
    userPresence.on("presenceUpdate", (direction, state) => {
      if (
        direction == thisTrigger.stateChange &&
        state == thisTrigger.presenceValue
      ) {
        //if the presence update meets the trigger conditions, run the command
        console.log(
          "triggered trigger! Executing command: '" + thisTrigger.cmd + "'"
        );
        exec(thisTrigger.cmd);
      }
    });
  }
}
*/


///////////////////////
// Tray interactions //
///////////////////////

//trayIcon = new Tray('../../../assets/icons/png/16x16.png')
console.log(path.join(__dirname, "../../../assets/icons/png/64x64.png"))
let trayIcon = new Tray(path.join(__dirname, "../../../assets/icons/png/64x64.png"))
const trayMenuTemplate = [
  {
    label: 'settings',
    click: ()=>{ipcRenderer.send('show')}
  },
  {
    label: 'exit',
    click: ()=>{ipcRenderer.send('exit')}
  }
]
let trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
trayIcon.setContextMenu(trayMenu)


////////////////////////
// UI event handeling //
////////////////////////

document.getElementById('save-button').addEventListener("click", saveSettings);
document.getElementById('reload-button').addEventListener("click", reload);
document.getElementById('logout-button').addEventListener("click", logout);

document.getElementById('ringtone-test-button').addEventListener("click", testRingtone);

//load settings to UI
setSelect(document.getElementById('ringtone'), settings.get("appSettings.ringtone", 'OpenOffice'))
setSelect(document.getElementById('volume'), settings.get("appSettings.volume", 4))

function setSelect(element,value){
  for (option of element.options){
    if (option.value ==  value){
      option.selected = true
    }
  }
}

function testRingtone(){
  let ringtone = document.getElementById('ringtone').value
  let volume = parseInt(document.getElementById('volume').value)
  //send command to main proccess to ring
  ipcRenderer.send('busylight-ring-test', ringtone, volume)

}


function saveSettings(){
  settings.set('appSettings.ringtone', document.getElementById('ringtone').value)
  settings.set('appSettings.volume', parseInt(document.getElementById('volume').value))
}

function reload(){}
function logout(){}

///////////////////////////////////////
// Presence and call event handeling //
///////////////////////////////////////

function handlePresenceUpdate(status, result) {
  ipcRenderer.send('presence-update', result)
  document.getElementById('status').innerHTML = result.status.presence;
  document.getElementById('tags').innerHTML = result.status.platformData.data.tags;
  // TODO: update busylight or whatever, from here 
}
function handleCallUpdate(status, result) {
  if (status) {
    document.getElementById('websocket-status').innerHTML = status.event;
  }
  if (result) {
    ipcRenderer.send('new-call-event', result.status.presence)
    document.getElementById('call-event').innerHTML = result.status.presence;
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
  //presenceWatcher.start(handlePresenceUpdate);
  //const callEventsWatcher = new CallEventsWatcher(cjson);
  //callEventsWatcher.start(handleCallUpdate);

  //const presenceWatcher = new PresenceWatcher.PresenceWatcher(cjson, 5000);
  const presenceWatcher = new PresenceWatcher(cjson, 5000);
  const callEventsWatcher = new CallEventsWatcher(cjson);
  callEventsWatcher.start(handleCallUpdate);
  presenceWatcher.start(handlePresenceUpdate);
});
