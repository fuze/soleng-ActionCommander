"use strict";
const crypt = require("./util/util.password");

function localConfigSettings() {}

////////////////////////////////////////////////////////////////////////////////////////
// getUsername/setUsername
// This is used to get/set the fuze username
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getUsername = function() {
  return localStorage.getItem("fuze-username");
};

localConfigSettings.prototype.getTrimmedUsername = function() {
  var tmpuser = this.getUsername();
  console.log("getTrimmedUsername " + tmpuser);
  if (tmpuser.indexOf(" ") > 0) {
    console.log(
      "getTrimmedUsername " + tmpuser.substr(0, tmpuser.indexOf(" "))
    );
    return tmpuser.substr(0, tmpuser.indexOf(" "));
  }
  console.log("getTrimmedUsername " + tmpuser);
  return tmpuser;
};

localConfigSettings.prototype.setUsername = function(username) {
  console.log("setUsername: " + username);
  var previousUsername = this.getUsername();
  localStorage.setItem("fuze-username", username);
};

////////////////////////////////////////////////////////////////////////////////////////
// getPassword/setPassword
// This is used to get/set the fuze password
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getPassword = function() {
  return crypt.decryptPassword(localStorage.getItem("fuze-password"));
};
localConfigSettings.prototype.setPassword = function(password) {
  console.log("setPassword: " + password);
  var previousPassword = this.getPassword();
  localStorage.setItem("fuze-password", password);
};

////////////////////////////////////////////////////////////////////////////////////////
// getTenantId/setTenantId
// This is used to get the fuze tenant id
// The Tenant ID is set upon a successful query to the database.
// Once Set it emits an event so the event listener can perform approiate actions, e.g.
// Change the UI -- imb.setup.js
//===================================================================================//
localConfigSettings.prototype.getTenantId = function() {
  return localStorage.getItem("fuze-tenantid");
};

localConfigSettings.prototype.setTenantId = function(tenantid) {
  console.log("setTenantId: " + tenantid);
  var previousTenantId = this.getTenantId();
  localStorage.setItem("fuze-tenantid", tenantid);
};

////////////////////////////////////////////////////////////////////////////////////////
// Warden Token Field
localConfigSettings.prototype.getWardenToken = function() {
  return localStorage.getItem("wardenToken");
};
localConfigSettings.prototype.setWardenToken = function(wardenToken) {
  console.log("wardenToken: " + wardenToken);
  localStorage.setItem("wardenToken", wardenToken);
};

//////////////////////////////////////////////////////////////////////////////////////////
// getUserDataCallBack
localConfigSettings.prototype.setLocalUserData = function(userdata) {
  console.log("setLocalUserData <" + JSON.stringify(userdata, null, 2));

  this.setUsername(userdata.username);
  this.setPassword(userdata.password);
  this.setTenantId(userdata.tenant_id);
  this.setWardenToken(userdata.wardenToken);
};
module.exports = new localConfigSettings();
