let busylight
const { ipcMain } = require('electron');
const settings = require('electron-settings');
//const presenceClient = require('soleng-presence-client');
//const cjson = require('../../config/config.json');

function start(wardenData){
	busylight = require('busylight').get()
	busylight.defaults({
	  keepalive: true,      // If the busylight is not kept alive it will turn off after 30 seconds
	  color: 'green',       // The default color to use for light, blink and pulse
	  duration: 30 * 1000,  // The duration for a blink or pulse sequence
	  rate: 300,            // The rate at which to blink or pulse
	  degamma: true,        // Fix rgb colors to present a better light
	  tone: settings.get("appSettings.ringtone", 'OpenOffice'),   // Default ring tone
	  volume: settings.get("appSettings.volume", 4)             // Default volume
	});

	settings.watch("appSettings.ringtone", (newRingtone)=>{busylight.defaults({'tone': newRingtone})})
	settings.watch("appSettings.volume", (newVolume)=>{busylight.defaults({'volume': newVolume})})

}


function handlePresenceUpdate(data){
	console.log(data.status.presence)
	//testing lines
	//if (data.status.presence == "busy" && data.status.platformData.data.tags.indexOf('call') != -1){
	if (data.status.platformData.data.tags.indexOf('dnd') != -1){
		setColor('pink')
	}	else if (data.status.platformData.data.tags.indexOf('call') != -1 || data.status.presence == 'busy'){
		setColor('red')
	} else if (data.status.presence == 'available'){
		setColor('green')
	} else if (data.status.presence == 'away'){
		setColor('yellow')
	} else if (data.status.presence == 'offline'){
		setColor('black')
	}
}
function handleCallEvent(callEvent){
	if (callEvent == "call_ring"){startRing()}
	if (callEvent == "call_connected"){stopRing()}
	if (callEvent == "call_end"){stopRing()}

}
/*
function pushDataToConfObject(confObject, authDetails) {
  confObject.username = authDetails.data.entity.origin.id;
  confObject.tenantId = authDetails.data.entity.tenantKey;
  confObject.wardenToken = authDetails.data.grant.token;

  return confObject;
}
*/
ipcMain.on('presence-update', (event, data) => {
  handlePresenceUpdate(data)
})
ipcMain.on('new-call-event', (event, data) => {
  handleCallEvent(data)
  console.log(data)
})

ipcMain.on('get-device-status', (event)=>{
	event.sender.send('device-status', busylight.connected)
})

function startRing(){
	busylight.ring().blink() //ring and blink using the default values for color, tone, and volume
}

function stopRing(){
	busylight.ring(false).blink(false)
	busylight.light() //set the light back to the color set in defualts (current color)
}

function setColor(color){
	busylight.defaults({'color': color}) //update the defualt color so we can blink the correct color when there is an incomming call
	busylight.light(color)
}

ipcMain.on('busylight-ring-test', (event, tone, volume) => {
  busylight.ring(tone, volume)
  setTimeout(()=>{busylight.ring(false)}, 8000);
})


/*
ipcMain.on('contents-loaded', (event, data) => {
  let configuration = pushDataToConfObject(cjson, data);
  presenceClient.start(configuration, handlePresenceUpdate);
});
*/
module.exports = {
  start: start
}
