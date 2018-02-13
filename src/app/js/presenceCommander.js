//app script
module.exports = {}

let contents
let currentStatus = {}
fuzePresence = require('./fuzePresence.js')
const { ipcMain } = require('electron');
const settings = require('electron-settings')
const { exec } = require('child_process')
let thisWindow
let wardenData
module.exports.onReady = function onReady(browserWindow){
  console.log("starting background process")
  thisWindow = browserWindow
  contents = browserWindow.webContents
  wardenData = browserWindow.wardenData
  setUpTriggers(settings.get('appSettings.triggers', []))
  settings.watch('appSettings.triggers', (newTriggers) => {
  	setUpTriggers(newTriggers)
  })
  scheduler(5000, getPresence, ()=>{
  	//if settings show proccess triggers on startup
  	console.log("presence initialized")
  	if (settings.get('appSettings.triggerOnStartup', false) == true){ //read the saved value. Default to false
  		console.log("proccessing startup triggers")
  		userPresence.forceEmit()	
  	}
  })
}

function getPresence(callback){
	fuzePresence.getPresence(wardenData.data.grant.token, (err, response)=>{
		try {
			if (err){
				throw ("error: " + err + JSON.stringify(response))
			}else{
				sendPresenceData(response.data) //the old way
				userPresence.updatePresence(response.data)
				if(callback){callback()}
			}
		} catch (err){
			console.log("error getting updated presence")
			console.log(err)
		}
	})
}

module.exports.stop = function stop (){
	for (i in intervals){
		clearInterval(intervals[i])
	}
}

let intervals = []
function scheduler(rate, job, callback){
	job(callback) //run the job right away
	intervals.push(setInterval(job, rate))
	
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
const EventEmitter = require('events')
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
userPresence = new Presence()

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

const settingsURL = `file://${__dirname}/../html/settings.html`
const mainURL = `file://${__dirname}/../../${pjson.config.mainurl}`

ipcMain.on('open settings', () => {
	thisWindow.loadURL(settingsURL, {})
})

ipcMain.on('close settings', () => {
	thisWindow.loadURL(mainURL, {})
})