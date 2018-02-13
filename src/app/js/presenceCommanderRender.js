const electron = require('electron')
const ipc = electron.ipcRenderer
const mainWindow = electron.remote.getGlobal('mainWindow')


window.onload = function () {
	ipcRenderer.send('main loaded')
  ipc.on('new status', (event, message) => {
  	document.getElementById("status").innerHTML = message.status //set status to the value of message
  	document.getElementById("tags").innerHTML = message.tags
  	console.log(message)
  })

  console.log(mainWindow.wardenData)
}