const { icpRenderer } = require('electron')
const settings = require('electron-settings')
console.log('something else entirely')
window.onload = function () {
	console.log("settings page loaded!")
  let cancleButton = document.getElementById("cancle-button")
  let saveButton = document.getElementById("save-button")
  cancleButton.setAttribute("onclick", "cancle()")
  saveButton.setAttribute("onclick", "saveSettings()")
  let triggerPane = document.getElementById("trigger-pane")
  loadTriggerList(triggerPane)

}

function cancle(){
  icpRenderer.send('close settings')
}

function saveSettings(){
	//icpRenderer.send('save settings', getTriggerList())
	settings.set('triggers', triggerList)
	icpRenderer.send('close settings')
}



function loadTriggerList(triggerPane){ //loads trigger list from settings
	let triggerList = settings.get('triggers', []) //get the list of triggers that are saved. If the setting does not exist, initize an array
  for (i in triggerList){
  	addTriggerRow(triggerPane, triggerList[i])
  }
  addTriggerRow(triggerPane)
}

class TriggerRow {
  constructor(stateChange,presenceValue,cmd) {
  	this.stateChange = stateChange
  	this.presenceValue = presenceValue
  	this.cmd = cmd
  }

  createSelect(value, list){
  	let input = document.createElement('select')
  	for (var i in list){
  		let option = document.createElement('option')
  		option.setAttribute('value', list[i])
  		option.innerHTML = list[i]
  		if (list[i] == value){input.selectedIndex = option.index} //Sets the default state of the dropdown
  		input.appendChild(option)
  	}
  	return input
  }
  createInput(value){
  	let input = document.createElement('input')
  	input.setAttribute('type', 'text')
  	if (value !== undefined){
  		input.setAttribute('value', value)
  	}
  	return input
  }

  get createElement() {
  	let row = document.createElement('div')
  	row.setAttribute('class', 'trigger-row')
  	let stateChangeInput = this.createSelect(this.stateChange,["to","from"])
  	let presenceValueInput = this.createSelect(this.presenceValue,["available","busy"]) //add more values
  	let cmdInput = this.createInput(this.cmd)
  	
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

}