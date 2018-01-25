const { ipcRenderer } = require('electron')
const settings = require('electron-settings')
window.onload = function () {
	console.log("settings page loaded!")
  let cancleButton = document.getElementById("cancle-button")
  let saveButton = document.getElementById("save-button")
  cancleButton.addEventListener("click", cancle)
  saveButton.addEventListener("click", saveSettings)
  //cancleButton.setAttribute("onclick", "cancle()")
  //saveButton.setAttribute("onclick", "saveSettings()")
  let triggerPane = document.getElementById("trigger-pane")
  loadTriggerList(triggerPane)

}

function cancle(){
	ipcRenderer.send('close settings')
}

function saveSettings(){
	//icpRenderer.send('save settings', getTriggerList())
	let triggerList = getTriggerList()
	settings.set('triggers', triggerList)
	ipcRenderer.send('close settings')
}



function loadTriggerList(triggerPane){ //loads trigger list from settings
	let triggerList = settings.get('triggers', []) //get the list of triggers that are saved. If the setting does not exist, initize an array
  for (i in triggerList){
  	addTriggerRow(triggerPane, triggerList[i])
  }
  addTriggerRow(triggerPane)
}

class TriggerRow {
  constructor(values) {
  	this.stateChange = values.stateChange
  	this.presenceValue = values.presenceValue
  	this.cmd = values.cmd
  }

  createSelect(className, value, list){
  	let input = document.createElement('select')
  	input.setAttribute('class', className)
  	for (var i in list){
  		let option = document.createElement('option')
  		option.setAttribute('value', list[i])
  		option.innerHTML = list[i]
  		//if (list[i] == value){input.selectedIndex = option.index} //Sets the default state of the dropdown

  		input.appendChild(option)
  	}
  	if (value){input.value = value}
  	return input
  }
  createInput(className, value){
  	let input = document.createElement('input')
  	input.setAttribute('class', className)
  	input.setAttribute('type', 'text')
  	if (value !== undefined){
  		input.setAttribute('value', value)
  	}
  	return input
  }

  get createElement() {
  	let row = document.createElement('div')
  	row.setAttribute('class', 'trigger-row')
  	let stateChangeInput = this.createSelect("stateChange", this.stateChange, ["to","from"])
  	let presenceValueInput = this.createSelect("presenceValue", this.presenceValue, ["available","busy"]) //add more values
  	let cmdInput = this.createInput("cmd", this.cmd)
  	
  	row.appendChild(stateChangeInput)
  	row.appendChild(presenceValueInput)
  	row.appendChild(cmdInput)
  	return (row)
  }
}

function addTriggerRow(triggerPane, values){ //adds row of UI elements to the end of the trigger list
	if (values === undefined){
		values = {stateChange: "to", presenceValue: "busy", cmd: undefined}
	}
	let triggerRow = new TriggerRow(values)
	triggerPane.appendChild(triggerRow.createElement)
}


function getTriggerList(){ //reads the list of triggers from the UI and returns an array
	let triggerList = []
	let triggerPane = document.getElementById("trigger-pane")
	let rowList = triggerPane.children
	for (var i=0; i<rowList.length; i++){  //save each triggerRow in the UI as an object in the triggerList
		let thisRow = rowList.item(i)
		let tirggerObject = {}
		tirggerObject.stateChange = thisRow.querySelector('.stateChange').value
		tirggerObject.presenceValue = thisRow.querySelector('.presenceValue').value
		tirggerObject.cmd = thisRow.querySelector('.cmd').value
		if (tirggerObject.cmd){
			triggerList.push(tirggerObject)
		}
	}
	return triggerList

}