'use strict'
const XMLHttpRequest	= require('xmlhttprequest').XMLHttpRequest

function universalLogin() {};
///////////////////////////////////////////////////////////////
function getParameterByName (name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};



function verifyToken(results, callback) {
  var url = 'https://warden.thinkingphones.com/api/v1/tokens/current';
  var xhr = new XMLHttpRequest();

  xhr.withCredentials = true;
  xhr.open('GET', url, true);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("authorization",  'Bearer ' + results.data.grant.token );
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if ( xhr.status == 200 ) {
        console.log("Final Token " + results.data.grant.token)
        callback(results);
      }
    }

  }
  xhr.send(null);
}

universalLogin.prototype.replaceToken = function (url, callback) {

  var tmpToken = getParameterByName('token', url);

  if (tmpToken) {
    var postUrl = 'https://warden.thinkingphones.com/api/v1/tokens/current/exchange';
    var xhr = new XMLHttpRequest();

    xhr.withCredentials = true;
    xhr.open('POST', postUrl, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-Long-Encoding", "string");
    xhr.setRequestHeader("Authorization", 'Bearer ' + tmpToken);

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var results = JSON.parse(xhr.responseText);
          console.log("Warden Token Exchange == " + xhr.responseText);
          verifyToken(results, callback)
        } else {
          console.log("xhr.responseText = " + xhr.responseText);
          console.log("xhr.status = " + xhr.status);
        }
      }
    };
    xhr.send();
  }
}

module.exports = new universalLogin();
