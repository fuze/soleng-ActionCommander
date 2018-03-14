"use strict";

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const bg = require("./generalSetGet");
const lc = require("./localConfigSettings");
let ws;
let fuzeAuthenticationURL;
let fuzeWebSocketURL;

const lsnrdebug = 0;
const socketUser = lc.getTrimmedUsername();
const socketPassword = lc.getPassword();
const socketWardenToken = lc.getWardenToken();
const socketTenant = lc.getTenantId();

let _lastHeartbeat = 0;
let _keepAlive = true;
let _unsubscribeId;
let _unsubscribeURL;
let _destinationFixedId;
let _isCallActive = false;
let _socketMessage;
let _callback;
let _watchInt;

function setOptions(options) {
  fuzeAuthenticationUrl = options.config.fuzeAuthenticationUrl;
  fuzeWebSocketURL = options.config.fuzeWebSocketURL;
  _sockettimer = options.config.socketTimer;
}

////////////////////////////////////////////////////////////////////////////////////////
exports.startSocket = function(opts, callback) {
  _callback = callback;
  setOptions(opts);
  console.info("fuzeListener: fuzeAuthenticationURL " + fuzeAuthenticationURL);
  console.info("fuzeListener: fuzeWebSocketURL " + fuzeWebSocketURL);
  console.info("fuzeListener: _sockettimer " + _sockettimer);
  console.info("fuzeListener: socketUser " + socketUser);
  console.info("fuzeListener: socketPassword " + socketPassword);
  console.info("fuzeListener: socketWardenToken " + socketWardenToken);
  console.info("fuzeListener: socketTenant " + socketTenant);
  __startSocket();
};

////////////////////////////////////////////////////////////////////////////////////////
exports.stopSocket = function(callback) {
  _callback = callback;
  __stopSocket(callback);
};

////////////////////////////////////////////////////////////////////////////////////////
function __startSocket() {
  //var try2Open;
  console.log(
    "fuzeListener: username: " +
      socketUser +
      ", password: " +
      socketPassword +
      " , tenantid: " +
      socketTenant
  );
  console.log("fuzeListener: fuzeAuthenticationURL " + fuzeAuthenticationURL);
  console.log("fuzeListener: ws " + ws);

  if (typeof ws === "undefined" || typeof ws === "string") {
    console.log("startSocket:ws not declared yet.");
    __openConnection();
  } else {
    console.log("ws.startSocket " + ws.readyState);
    switch (ws.readyState) {
      case 0:
        console.log("startSocket: Connecting.");
        break;
      case 1:
        console.log("startSocket: Already connected.");
        break;
      case 3:
        console.log("startSocket: Closing.");
        break;
      case 4:
        console.log("startSocket: Closed.");
        break;
      default:
        console.log("startSocket: Unknown - no state.");
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////
function __openConnection() {
  console.log("__openConnection: In try2Open.");

  var xhr = new XMLHttpRequest();

  console.log("__openConnection -- |" + socketUser + "|");
  console.log("__openConnection -- " + socketPassword);
  console.log("__openConnection -- " + socketTenant);

  xhr.open("POST", fuzeAuthenticationURL, true);
  //xhr.setRequestHeader("Authorization",  'Bearer ' + tempToken );

  xhr.setRequestHeader("Authorization", "Bearer " + socketWardenToken);
  xhr.onreadystatechange = function() {
    console.log("startSocket:readystate == changed.");

    if (xhr.readyState == 4) {
      var token = xhr.responseText;
      ws = new WebSocket(fuzeWebSocketURL + token);
      console.log("fuzeListener:token== token  " + token);
      console.log("fuzeListener:wss call == " + fuzeWebSocketURL + token);
      // On Open
      ws.onopen = function(event) {
        console.log("fuzeListener: ws.onopen == " + JSON.stringify(event));
        __socketOpen();
      };
      // On close
      ws.onclose = function(event) {
        console.log("fuzeListener: ws.onclose == " + event);
        __socketClose();
      };

      // On Error
      ws.onerror = function(event) {
        //console.log('fuzeListener: ws.onerror == ' + JSON.stringify(event));
        __socketError(JSON.parse(event.data));
      };

      //On Message Received
      ws.onmessage = function(event) {
        //console.log('fuzeListener: ws.message == ' + JSON.stringify(event.data));
        __socketMessage(JSON.parse(event.data));
      };
    }
  };
  xhr.send();
}

////////////////////////////////////////////////////////////////////////////////////////
function __stopSocket() {
  try {
    ws.close();
  } catch (e) {}
  clearInterval(_watchInt);
  console.warn(
    "stopSocket: Setting connect to null and saving to localStorage"
  );
  ws = "undefined";
  //_keepAlive = false;
  bg.setUnSubscribeID(false);
  bg.setSocketStatus(false);
  bg.setSocketMessage("Not Currently The Active Listener");
  _callback(
    JSON.parse(
      '{"code" : 200, "action" : 2001, "event" : "Stopped Socket",  "message" : "Socket Stopped" }'
    )
  );
}

////////////////////////////////////////////////////////////////////////////////////////
function unSubscribe(id) {
  var unsubscribeMe =
    '{"id": "12", "operation":"delete","subscription":{"id":"' + id + '"}}';
  console.log("unSubscribe: unsubscribeMe " + unsubscribeMe);
  try {
    ws.send(unsubscribeMe);
  } catch (e) {}

  console.log(
    "unSubscribe: Setting connect to null and saving to localStorage"
  );
}

///////////////////////////////////////////////////////////////////////////////////////
function traverseCallEvent(json) {
  var type = typeof json;
  var subscriptions = json.subscription.result.records;
  var length = subscriptions.length;

  console.log("traverseCallEvent: Type of json == " + type);
  console.log("traverseCallEvent: json == " + JSON.stringify(subscriptions));
  console.log("traverseCallEvent: json == " + length);
  for (var i = 0; i < length; i++) {
    //_unsubscribeId = json.subscription.result.records[0].id;
    console.log(
      "traverseCallEvent: _unsubscribeId == i " +
        i +
        " " +
        JSON.stringify(subscriptions[i].id)
    );
    var unsubscribeMe =
      '{"operation":"delete","subscription":{"id":"' +
      subscriptions[i].id +
      '"}}';
    console.log("unSubscribe: unsubscribeMe " + unsubscribeMe);
    try {
      ws.send(unsubscribeMe);
    } catch (e) {}
  }
}

///////////////////////////////////////////////////////////////////////////////////////
function __restartSocket() {
  __stopSocket();
  setTimeout(function() {
    console.warn("Wait 10 seconds");
    __startSocket();
  }, 10000);
}
///////////////////////////////////////////////////////////////////////////////////////
function __disconnectRecovery() {
  setInterval(function() {
    if (_keepAlive === true && bg.getSocketStatus() === false) {
      __startSocket();
    }
  }, _sockettimer * 1000);
}
///////////////////////////////////////////////////////////////////////////////////////
function __socketWatcher() {
  console.warn(
    "fuzeListener: (socketWatcher) keepAlive " +
      bg.getFormattedDate("mdy") +
      " keep alive " +
      _keepAlive
  );
  if (
    ws !== "undefined" &&
    (_keepAlive === true || bg.getSocketStatus() === true)
  ) {
    _watchInt = setInterval(function() {
      if (ws !== "undefined") {
        var diff = Math.round((Date.now() - _lastHeartbeat) / 1000);
        if (diff >= _sockettimer) {
          //console.log("fuzeListener: (socketWatcher) keepAlive " + bg.getFormattedDate('mdy') + " keep alive " + _keepAlive +" socketstatus " + _socketStatus);
          //console.log('fuzeListener: (socketWatcher) Last heartbeat was ' + diff + ' minutes ago. Does the Socket need to be Reset?');

          var testVal =
            '{"id": "20", "operation":"retrieve","call":{"tenantId":"' +
            socketTenant +
            '", "userId":"' +
            socketUser +
            '"}}';
          console.warn("fuzeListener: (socketWatcher) " + ws);
          if (
            ws !== "undefined" &&
            (_keepAlive !== false || bg.getSocketStatus() !== false)
          ) {
            try {
              ws.send(testVal);
            } catch (e) {
              __stopSocket();
              bg.setSocketStatus(false);
              bg.setSocketMessage("Socket Unexpecdly Closed");
              console.warn("fuzeListener: (socketWatcher) " + e.message);
            }
          }
        }
      }
    }, _sockettimer * 1000);
  } else {
    console.warn("fuzeListener: (socketWatcher) " + ws);
    __stopSocket();
  }
}
////////////////////////////////////////////////////////////////////////////////////////
function __getCurrentCall() {
  console.log("__getCurrentCall: getCurrentCall: Getting call info.");

  var getCall =
    '{"id": "20", "operation":"retrieve","call":{"tenantId":"' +
    socketTenant +
    '", "userId":"' +
    socketUser +
    '"}}';

  try {
    ws.send(getCall);
  } catch (e) {
    console.log("fuzeListener: getCurrentCall TestSocket " + e.message);
  }
}
///////////////////////////////////////////////////////////////////////////////////////
function __socketError(eventData) {
  console.log("fuzeListener Event == " + eventData.operation);
  console.log("fuzeListener: Error " + eventData.data);
  bg.setSocketStatus(false);
  //__disconnectRecovery();
  bg.setSocketMessage("Unknown Web Socket Error");
}
///////////////////////////////////////////////////////////////////////////////////////
function __socketClose(eventData) {
  console.log("__socketClose: Disconnected");
  console.log(
    "__socketClose: Disconnected" +
      " " +
      bg.getFormattedDate("mdy") +
      " " +
      JSON.stringify(eventData)
  );

  // Put something in here to restart the connection...
  console.log("__socketClose: keepalive value == " + _keepAlive);

  if (_keepAlive !== false) {
    bg.setSocketMessage("Socket Unexpectedly Closed");
    __restartSocket();
    bg.setSocketStatus(false);
  } else {
    ws = "undefined";
    clearInterval(__socketWatcher);
    bg.setSocketStatus(false);
    //bg.setRunInBg(false);
    bg.setSocketMessage("Socket Intentionally Closed");
  }
}
///////////////////////////////////////////////////////////////////////////////////////
function __socketOpen(eventData) {
  console.log("fuzeListener: Open Checking on Active Listener");
  try {
    ws.send(
      '{"id" : "10", "operation":"create","subscription":{"tenantId":"' +
        socketTenant +
        '","userId":"' +
        socketUser +
        '"}}'
    );
    _lastHeartbeat = Date.now();
  } catch (e) {
    console.log("fuzeListener: (socketWatcher) " + e.message);
  }
}
///////////////////////////////////////////////////////////////////////////////////////
function __socketMessage(eventData) {
  //console.log("__socketMessage PAYLOAD before Processing " + JSON.stringify(eventData));

  if (eventData.id == "10") {
    console.warn(
      "__socketMessage message type (10) " +
        eventData.operation +
        "\n" +
        JSON.stringify(eventData)
    );
    if (eventData.status.code != 401) {
      __createMessage(eventData);
    } else {
      __unauthorizedMessage(eventData);
    }
  } else if (eventData.id == "11") {
    console.log("__socketMessage message type (11) " + eventData.operation);
    if (eventData.status.code != 401) {
      __retrieveMessage(eventData);
    } else {
      __unauthorizedMessage(eventData);
    }
  } else if (eventData.id == "12") {
    console.log("__socketMessage message type (12) " + eventData.operation);
  } else if (eventData.id == "20") {
    if (
      eventData.call.result.count == 1 &&
      (!JSON.parse(bg.getCallList()) && !JSON.parse(bg.getCurrentCall()))
    ) {
      __handleCallEvent(eventData.call.result.records[0]);
    } else if (eventData.call.result.count == 0) {
      console.log("Before Setting the setCallList & setCurrentCall to false");
      bg.setCallList(false);
      bg.setCurrentCall(false);
    }
  } else {
    console.warn(
      "__socketMessage message THIS CALL BEING Procesed " +
        JSON.stringify(eventData)
    );
    if (eventData.status != 401) {
      var prevId = "n/a";
      try {
        prevId = eventData.callStateUpdate.previousCallIds[0];
      } catch (e) {}

      console.log(
        "__socketMessage message THIS CALL BEING Procesed " +
          "prevId " +
          prevId +
          " " +
          JSON.stringify(eventData)
      );
      console.log(
        "__socketMessage message BEFORE HANDLE __handleCallEvent CallList and CurrentCall " +
          "\n" +
          bg.getCallList() +
          "\n" +
          bg.getCurrentCall()
      );
      if (!JSON.parse(bg.getCallList()) && !JSON.parse(bg.getCurrentCall())) {
        //console.log("__socketMessage message BEFORE HANDLE __handleCallEvent CallList and CurrentCall " + "\n" + bg.getCallList() + "\n" + bg.getCurrentCall() + "\n" + JSON.stringify(eventData));
        __handleCallEvent(eventData.callStateUpdate);
        // handling all actions after the first call.
      } else if (
        JSON.parse(bg.getCallList()) &&
        bg.getCurrentCall() == eventData.callStateUpdate.callId
      ) {
        console.log(
          "__socketMessage message BEFORE HANDLE __handleCallEvent CallList and CurrentCall " +
            "\n" +
            bg.getCallList() +
            "\n" +
            bg.getCurrentCall() +
            "\n" +
            eventData.callStateUpdate.callId +
            "\n" +
            JSON.stringify(eventData)
        );
        __handleCallEvent(eventData.callStateUpdate);
      } else if (
        JSON.parse(bg.getCallList()) &&
        (bg.getCurrentCall() != eventData.callStateUpdate.callId &&
          (prevId != "n/a" &&
            eventData.callStateUpdate.previousCallIds[0] == prevId))
      ) {
        console.log(
          "__socketMessage message FALL THROUGH BEFORE HANDLE __handleCallEvent CallList and CurrentCall " +
            JSON.stringify(eventData)
        );
        __handleCallEvent(eventData.callStateUpdate);
      } else {
        __handleCallEvent(eventData.callStateUpdate);
        console.log(
          "__socketMessage message THIS MUST BE A CALL " + bg.getCallList()
        );
        console.log(
          "__socketMessage message THIS MUST BE A CALL " + bg.getCurrentCall()
        );
        console.log(
          "__socketMessage message THIS CALL BEING IGNORED " +
            JSON.stringify(eventData)
        );
      }
    } else {
      __unauthorizedMessage(eventData);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////
function __createMessage(eventData) {
  // Need Error Checking and retry
  console.log(
    "__createMessage message type (10) " + JSON.stringify(eventData, null, 2)
  );

  _unsubscribeURL =
    eventData.subscription.result.records[0].unsubscribeUrl || "";
  _unsubscribeId = eventData.subscription.result.records[0].id || "";
  bg.setUnSubscribeID(_unsubscribeId);

  console.log("__createMessage: unsubscribeURL: " + _unsubscribeURL);
  console.log("__createMessage: unsubscribeId: " + _unsubscribeId);
  bg.setCallList(false);
  bg.setCurrentCall(false);
  bg.setSocketStatus(true);
  bg.setSocketMessage("Active Listener");
  // Let's See if there is an active call
  __socketWatcher();
  __getCurrentCall();
  console.warn(
    "stopSocket: Setting connect to null and saving to localStorage"
  );
  _callback(
    JSON.parse(
      '{"code" : 200, "action" : 2000, "event" : "socket-started",  "message" : "Active Listener" }'
    )
  );
}
///////////////////////////////////////////////////////////////////////////////////////
function __retrieveMessage(eventData) {
  console.log(
    "__retrieveMessage message type (11) " + JSON.stringify(eventData, null, 2)
  );

  // Work on This
  if (eventData.status == "401") {
    var emessg =
      "Unable to setup listener.\r\n\r\n" +
      "Possible causes:\r\n" +
      "- Username and/or password are Incorrect\r\n" +
      '- Your account may need the \r\n"End-User Web Service Access" role added';
    console.log("__retrieveMessage: " + emessg);
    //alert(emessg);
    //alert('Unable to subscribe to listener.\r\n\nYour account may need the \"End-User Web Service Access\" role added' + eventData.reason);
    _keepAlive = false;
    bg.setSocketStatus(false);
    bg.setSocketMessage("Username and/or password are incorrect");
    console.warn("Username and/or password are incorrect");
    _callback(
      JSON.parse(
        '{"code" : 401, "action" : 2002, "event" : "socket-invalid-auth",  "message" : "Username and/or password are incorrect" }'
      )
    );
  } else if (typeof eventData.subscription !== undefined) {
    var subscriptionCount = eventData.subscription.result.count;
    console.log("__retrieveMessage: subscriptionCount : " + subscriptionCount);

    if (subscriptionCount == 1) {
      console.log(
        "__retrieveMessage: This is the Subscription " +
          eventData.subscription.result.records[0].id
      );
      console.log(
        "__retrieveMessage: Old Subscription ? " + bg.getUnSubscribeID()
      );
      bg.setUnSubscribeID(eventData.subscription.result.records[0].id);
      console.warn("Active Listener");
      _callback(
        JSON.parse(
          JSON.parse(
            '{"code" : 200, "action" : 2000, "event" : "socket-started",  "message" : "Active Listener" }'
          )
        )
      );
    } else if (subscriptionCount > 1) {
      console.log(
        "__retrieveMessage: Too Many Connections: We need to unmarshall all the listners and make this one the listener"
      );
      traverseCallEvent(eventData);
      bg.setSocketStatus(false); //
      bg.setSocketMessage("Too Many Connections");
    } else if (subscriptionCount == 0) {
      console.log("__retrieveMessage: No Subscription: Let's Make One");
      var subscribeMe =
        '{"id" : "10", "operation":"create","subscription":{"tenantId":"' +
        lc.getTenantId() +
        '","userId":"' +
        lc.getTrimmedUsername() +
        '"}}';

      ws.send(subscribeMe);
      bg.setSocketStatus(true);
      bg.setSocketMessage("Active Listener");
    } else {
      console.warn(
        "__retrieveMessage:  This is not a listening browser window."
      );
      __stopSocket();
      _callback(
        JSON.parse(
          '{"code" : 500, "action" : 2003, "event" : "not-a-listening-browser",  "message" : "This is not a listening browser window" }'
        )
      );
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////
function __unauthorizedMessage(eventData) {
  console.log(
    "__test__unauthorizedMessageMessage message type (20) " +
      JSON.stringify(eventData, null, 2)
  );

  // Work on This
  if (eventData.status == "401") {
    var emessg =
      "Unable to setup listener.\r\n\r\n" +
      "Possible causes:\r\n" +
      "- Username and/or password are Incorrect\r\n" +
      '- Your account may need the \r\n"End-User Web Service Access" role added';
    console.log("__unauthorizedMessage: " + emessg);
    //_keepAlive = false;
    bg.setSocketStatus(false);
    bg.setSocketMessage("Username and/or password are incorrect");

    _callback(
      JSON.parse(
        '{"code" : 401, "action" : 2002, "event" : "socket-invalid-Auth",  "message" : "Username and/or password are incorrect" }'
      )
    );
  }
}

///////////////////////////////////////////////////////////////////////////////////////
function __setDateTime(timestamp) {
  var date = new Date(timestamp);
  var datetime =
    date.getFullYear() +
    "-" +
    String("0" + (date.getMonth() + 1)).substr(-2) +
    "-" +
    String("0" + date.getDate()).substr(-2) +
    " " +
    String("0" + date.getHours()).substr(-2) +
    ":" +
    String("0" + date.getMinutes()).substr(-2) +
    ":" +
    String("0" + date.getSeconds()).substr(-2);

  return datetime;
}

///////////////////////////////////////////////////////////////////////////////////////
function __handleCallEvent(eventData) {
  console.info(
    "__handleCallEvent: eventData: " + JSON.stringify(eventData, null, 2)
  );

  var _datetime = __setDateTime(eventData.timestamp);
  var _direction = eventData.direction;
  if (eventData.destinationExtension == "Dial_Interface_List") {
    _direction = "OUTBOUND ";
  }

  if (eventData.previousCallIds !== undefined) {
    console.log("__handleCallEvent: eventData: " + eventData.previousCallIds);
    console.log(
      "__handleCallEvent: eventData: " + eventData.previousCallIds[0]
    );
  }

  var j = {};
  j.callData = new Array();
  j.callData.push({
    callstate: eventData.callState,
    callid: eventData.callId,
    tenantId: eventData.tenantId,
    userId: eventData.userId,
    fixedId: eventData.fixedId,
    destfixid: eventData.destinationFixedId,
    thinkingId: eventData.thinkingId,
    direction: _direction,
    clidname:
      _direction == "OUTBOUND"
        ? eventData.destinationName === undefined
          ? "Unknown"
          : eventData.destinationName
        : eventData.callerIdName,
    clid:
      _direction == "OUTBOUND"
        ? eventData.destinationExtension
        : eventData.callerIdNumber, // if outbound destnumber
    destinationId: eventData.destinationId,
    destname:
      _direction == "OUTBOUND"
        ? eventData.callId
        : eventData.destinationName === undefined
          ? "Unknown"
          : eventData.destinationName,
    destnumber:
      _direction == "OUTBOUND"
        ? eventData.callerIdNumber
        : eventData.destinationExtension === undefined
          ? ""
          : eventData.destinationExtension,
    destdevice: eventData.device,
    inConfrence:
      eventData.inConfrence === undefined ? false : eventData.inConfrence,
    previousCallIds:
      eventData.previousCallIds === undefined
        ? false
        : eventData.previousCallIds,
    dialedNumber:
      eventData.dialedNumber === undefined ? "Unknown" : eventData.dialedNumber,
    ringback: eventData.ringback === undefined ? false : eventData.ringback,
    duration: eventData.duration,
    timestamp: eventData.timestamp,
    datetime: __setDateTime(eventData.timestamp)
  });

  __handleCallActions(j.callData[0]);
}
///////////////////////////////////////////////////////////////////////////////////////
function __handleCallActions(callData) {
  console.info(
    "__handleCallActions: callData: " + JSON.stringify(callData, null, 2)
  );

  if (
    callData.direction == "INBOUND" ||
    (callData.direction == "OUTBOUND " && callData.callstate == "DIAL") ||
    callData.callstate == "RING" ||
    callData.callstate == "CONNECT" ||
    callData.callstate == "CALL_END" ||
    callData.callstate == "DIAL_CONNECTED" ||
    callData.callstate == "HANGUP" ||
    callData.callstate == "CALL_START"
  ) {
    if (callData.callstate == "DIAL" || callData.callstate == "CALL_START") {
      console.log(
        "__handleCallActions: callstate: DIAL || CALL_START for .... : " +
          JSON.stringify(callData, null, 2)
      );

      bg.setIsCallAnswered(false);
      bg.setCallList(true);
      bg.setCurrentCall(callData.callid);
      bg.setCallIdFromSocket(callData.callid);
      bg.setCallDirection(callData.direction);
      // Handle CALL_START
    } else if (callData.callstate == "RING") {
      console.log(
        "__handleCallActions: callState: RING ringback == !true for .... :\n" +
          JSON.stringify(callData, null, 2)
      );

      bg.setIsCallAnswered(false);
      bg.setCallList(true);
      bg.setCurrentCall(callData.callid);
      bg.setCallIdFromSocket(callData.callid);
      bg.setCallDirection(callData.direction);

      // HANDLE RING
    } else if (callData.callstate == "DIAL_CONNECTED") {
      bg.setCallList(true);
      bg.setCurrentCall(callData.callid);
      bg.setCallIdFromSocket(callData.callid);

      //HANDLE DIAL_CONNECTED
    } else if (callData.callstate == "CONNECT") {
      console.log(
        "__handleCallActions: callState: CONNECT ringback == ! true for .... :\n" +
          JSON.stringify(callData, null, 2)
      );
      bg.setIsCallAnswered(true);
      bg.setCallList(true);
      bg.setCurrentCall(callData.callid);
      bg.setCallIdFromSocket(callData.callid);
	  bg.setCallDirection(callData.direction);
	  
	  //HANDLE CONNECT
    } else if (callData.callstate == "CALL_END") {
      console.log(
        "__handleCallActions: callState: CALL_END for .... :\n" +
          JSON.stringify(callData, null, 2)
      );

      bg.setCurrentCall(false);
	  bg.setCallList(false);
	  
	  //CALL_END
    }
  }
}
