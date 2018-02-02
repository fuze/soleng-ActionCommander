//app script
module.exports = {}
//const {ipcMain} = require('electron')

let contents
let currentStatus = {}
fuzePresence = require('./fuzePresence.js')
const { ipcMain } = require('electron');
const settings = require('electron-settings')
let thisWindow

module.exports.onReady = function onReady(browserWindow){
  console.log("starting background process")
  thisWindow = browserWindow
  contents = browserWindow.webContents
  let wardenData = browserWindow.wardenData
  //console.log(wardenData)
  setUpTriggers(settings.get('triggers', []))
  settings.watch('triggers', (newTriggers) => {
  	setUpTriggers(newTriggers)
  })
  scheduler(5000,()=>{
  	fuzePresence.getPresence(wardenData, (err, response)=>{
  		try {
	  		if (err){
	  			throw ("error: " + err + JSON.stringify(response))
	  		}else{
	  			handlePresenceData(response.data) //the old way
	  			userPresence.updatePresence(response.data)
	  		}
  		} catch (err){
  			console.log("error getting updated presence")
  			console.log(err)
  		}
  	})
  })
}


module.exports.stop = function stop (){
	for (i in intervals){
		clearInterval(intervals[i])
	}
}

let intervals = []
function scheduler(rate,callback){
	intervals.push(setInterval(callback, rate))
}

function handlePresenceData(presenceData){
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
	presenceEmitter(direction, state){
		console.log("squeezing out an emit: " + direction + ", " + state)
		this.emit("presenceUpdate", direction, state)

	}
}
userPresence = new Presence()

function setUpTriggers(triggerList){
	userPresence.removeAllListeners()
	for (i of triggerList){
		console.log('setting up trigger:')
		console.log(i)
	}
}

userPresence.on('presenceUpdate', (direction, state) => {
	//some examples
	if (direction == "to" && state == "busy"){
		console.log("too busy!")
	}
	if (direction == "from" && state == "dnd"){
		console.log("disturb me!")
	}

})

///////////////////
// extra windows //
///////////////////
const settingsURL = `file://${__dirname}/../html/settings.html`
const mainURL = `file://${__dirname}/../../${pjson.config.mainurl}`

ipcMain.on('open settings', () => {
	thisWindow.loadURL(settingsURL, {})

	//thisWindow.on('closed', () => {
		//crmTypeWindow = null
	//})
});

ipcMain.on('close settings', () => {
	thisWindow.loadURL(mainURL, {})

	//thisWindow.on('closed', () => {
		//crmTypeWindow = null
	//})
});