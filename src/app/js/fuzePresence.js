const https = require("https")
const url = require('url')

module.exports = {}
module.exports.getPresence = function getPresence(wardenData, callback){

  let wardenToken = wardenData.data.grant.token
  let options = url.parse('https://presence.fuze.com/api/v1/entities/me/presence?')
  options.headers = {
    Authorization: "Bearer " + wardenToken
  }

  
  https.get(options, (response) => {
  	response.setEncoding("utf8");
 		let body = "";
  	response.on("data", data => {
    	body += data;
  	});
		response.on("end", () => {
			body = JSON.parse(body)
	  	const { status } = body
  		if (status !== 200){
  		  callback (status,body)
			} else {
  			callback(null,body)
			}
		})
  })
}