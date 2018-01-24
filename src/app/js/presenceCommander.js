//app script
module.exports = {}
//const {ipcMain} = require('electron')

let contents
let currentStatus = {}
fuzePresence = require('./fuzePresence.js')
const { ipcMain } = require('electron');
let thisWindow

module.exports.onReady = function onReady(browserWindow){
  console.log("starting background process")
  thisWindow = browserWindow
  contents = browserWindow.webContents
  let wardenData = browserWindow.wardenData
  //console.log(wardenData)
  scheduler(5000,()=>{
  	fuzePresence.getPresence(wardenData, (err, response)=>{
  		//console.log("res: " + JSON.stringify(response))
  		if (err){
  			throw ("error: " + err + response)
  		}else{
  			handlePresenceData(response.data)
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
		contents.send('new status',currentStatus.status)
	}
}

///////////////////
// extra windows //
///////////////////
const settingsURL = `file://${__dirname}/../html/settings.html`
const mainURL = `file://${__dirname}/../../${pjson.config.initurl}`

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