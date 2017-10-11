'use strict'

function encryptPassword(password) {
  var encoded = new Buffer(password).toString('base64')
  //console.debug('encoded == ' + encoded)
  return encoded
}

function decryptPassword(encodedString) {
  var decoded = "";

  if(encodedString){
    decoded = new Buffer(encodedString, 'base64').toString()
  }
  //console.debug('encoded == ' + decoded)
  return decoded
}

module.exports = {
  encryptPassword: encryptPassword,
  decryptPassword: decryptPassword
}
