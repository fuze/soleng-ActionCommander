const https = require("https");
const url = require("url");

function getPresence(wardenToken, callback) {
  let options = url.parse(
    "https://presence.fuze.com/api/v1/entities/me/presence?"
  );
  options.headers = {
    Authorization: "Bearer " + wardenToken
  };

  https.get(options, response => {
    response.setEncoding("utf8");
    let body = "";
    response.on("data", data => {
      body += data;
    });
    response.on("end", () => {
      body = JSON.parse(body);
      const { status } = body;
      if (status !== 200) {
        callback(status, body);
      } else {
        callback(null, body);
      }
    });
  });
};

module.exports = {
	getPresence,
}
