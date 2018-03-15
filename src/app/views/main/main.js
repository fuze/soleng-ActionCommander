
const { ipcMain } = require('electron');
const settings = require('electron-settings');
const { exec } = require('child_process');
const EventEmitter = require('events')

const settingsURL = `file://${__dirname}/../html/settings.html`
const mainURL = `file://${__dirname}/../../${pjson.config.mainurl}`

let contents;
let currentStatus = {};
let intervals = [];
let thisWindow;
let wardenData;

const userPresence = new Presence();

function onReady(browserWindow){
  console.log("starting background process");

  localStorage.getItem()

  thisWindow = browserWindow;
  contents = browserWindow.webContents;
  wardenData = browserWindow.wardenData;

  setUpTriggers(settings.get('appSettings.triggers', []));
  settings.watch('appSettings.triggers', (newTriggers) => {
  	setUpTriggers(newTriggers)
  })
}

function getPresence(callback) {
	fuzePresence.getPresence(wardenData.data.grant.token, (err, response)=>{
		try {
			if (err){
				throw ("error: " + err + JSON.stringify(response))
			}else{
				sendPresenceData(response.data); //the old way
				userPresence.updatePresence(response.data);
				if(callback){callback()}
			}
		} catch (err){
			console.log("error getting updated presence")
			console.log(err)
		}
	})
}

function sendPresenceData(presenceData){
	if (currentStatus.changedAt !== presenceData.changedAt){
		currentStatus = presenceData
		contents.send('new status',currentStatus)
	}
}

//////////////////////////////
// presence event handeling //
//////////////////////////////

class Presence extends EventEmitter {
	constructor(){
		super()
		this.state = {status: undefined, tags: undefined}
	}

	updatePresence (newState){
		if (typeof this.state.status !== "undefined"){
			if(this.state.status != newState.status){
				this.presenceEmitter("from", this.state.status)
				this.presenceEmitter("to", newState.status)
			}
		}
		this.state.status = newState.status

		if (typeof this.state.tags !== "undefined"){
			this.parseTags(this.state.tags, newState.tags)
		}
		this.state.tags = newState.tags
		return this.state
	}
	parseTags(oldTags, newTags){
		for (let i of oldTags){
			if (newTags.indexOf(i) == -1){
				this.presenceEmitter("from", i) //if the old tag is not found in newTags, emit an event for it
			}
		}
		for (let i of newTags){
			if (oldTags.indexOf(i) == -1){
				this.presenceEmitter("to", i) //if the new tag is not found in oldTags, emit an event for it
			}
		}
	}

	forceEmit(){ //forces the emitting of 'to' events for the current presence. Used for proccessing startup triggers
		this.presenceEmitter("to", this.state.status)
		for (let i of this.state.tags){
			this.presenceEmitter("to", i)
		}
	}
	presenceEmitter(direction, state){
		this.emit("presenceUpdate", direction, state)

	}
}


function setUpTriggers(triggerList){
	userPresence.removeAllListeners()
	for (let thisTrigger of triggerList){
		console.log('setting up trigger:')
		console.log(thisTrigger)
		userPresence.on('presenceUpdate', (direction, state) => {
			if (direction == thisTrigger.stateChange && state == thisTrigger.presenceValue){ //if the presence update meets the trigger conditions, run the command
				console.log("triggered trigger! Executing command: '" + thisTrigger.cmd + "'")
				exec(thisTrigger.cmd)
			}
		})
	}
}

///////////////////
// window events //
///////////////////
ipcMain.on('main loaded', () => { //when the main page is loaded send the current presence to be displayed
	sendPresenceData(userPresence.state)
});

ipcMain.on('open settings', () => {
	thisWindow.loadURL(settingsURL, {})
})

ipcMain.on('close settings', () => {
	thisWindow.loadURL(mainURL, {})
})

module.exports = { onReady };