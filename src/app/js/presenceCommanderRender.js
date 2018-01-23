const electron = require('electron')
const ipc = electron.ipcRenderer
const mainWindow = electron.remote.getGlobal('mainWindow')


window.onload = function () {
  ipc.on('new status', (event, message) => {
  	document.getElementById("status").innerHTML = message //set status to the value of message
  	console.log(message)
  })

  console.log(mainWindow.wardenData)
}