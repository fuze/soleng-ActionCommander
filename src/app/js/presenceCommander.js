//app script
module.exports = {}
//const {ipcMain} = require('electron')

let contents
let currentStatus = {}
fuzePresence = require('./fuzePresence.js')

module.exports.onReady = function onReady(browserWindow){
  console.log("starting background process")
  contents = browserWindow.webContents
  let wardenData = browserWindow.wardenData
  //console.log(wardenData)
  scheduler(5000,()=>{
  	fuzePresence.getPresence(wardenData, (err, response)=>{
  		console.log("err: " + err)
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