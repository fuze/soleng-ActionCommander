class TriggerManager {
	constructor(){
		this.callEventTriggers = []
		this.presenceTriggers = {'from' : [], 'to' : []}
	}

	addPresenceTrigger(trigger) {
		this.presenceTriggers.push(trigger)
	}

	addCallEventTrigger(trigger) {
		if (trigger.stateChange == "to"){
			this.callEventTriggers.to.push(trigger)
		} else if (trigger.stateChange == "from"){
			this.callEventTriggers.from.push(trigger)
		}
	}

	clearAllTriggers() {
		this.callEventTriggers = []
		this.presenceTriggers = {'from' : [], 'to' : []}
	}

	newCallEvent(data) {
		for (trigger of this.callEventTriggers){
			if (trigger.triggerValue == data.status.presence) {
				try {
					trigger.callback(data.status.platformData)
				} catch(err) {
					console.log("error exicuting trigger callback: " + err)
				}
			}
		}
	}

	newPresenceUpdate(data) {
		//make two arrays with all the status info for the new and old tags and status
		//then check to make sure that the value we are looking for is in the newState but not the oldState
		//or vice versa
		let newState = data.status.platformData.data.tags.concat(data.status.platformData.data.status)
		let oldState = data.previousStatus.platformData.data.tags.concat(data.previousStatus.platformData.data.status)
		for (trigger of this.presenceTriggers.to) {
			if (newState.includes(trigger.triggerValue) && !(oldState.includes(trigger.triggerValue))){
				try {
					trigger.callback()
				} catch(err) {
					console.log("error exicuting trigger callback: " + err)
				}
			}
		}
		for (trigger of this.presenceTriggers.from) {
			if (oldState.includes(trigger.triggerValue) && !(newState.includes(trigger.triggerValue))){
				try {
					trigger.callback()
				} catch(err) {
					console.log("error exicuting trigger callback: " + err)
				}
			}
		}
	}
}

module.exports = {
	TriggerManager: TriggerManager
}