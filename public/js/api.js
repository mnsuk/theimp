// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;

  String.prototype.obs = function() {
    var t1, t2;
    t1 = this.replace(/@/, '-AT-');
    t2 = t1.replace(/\./g, '-DOT-');
    return t2;
  };

  var socket = null;

  if (typeof(connectTo) !== 'undefined' && connectTo != null) {
    let uriStr = connectTo;
    if (local_data)
      uriStr = '?botmasterUserId=' + local_data._id.obs();
    // console.log('uri: ' + uriStr);
    var socket = io(uriStr);

    socket.on('message', function(botmasterMessage) {
      Api.setResponsePayload(JSON.stringify(botmasterMessage.message));
    });

    socket.on('error', function(err) {
      Api.setResponsePayload(JSON.stringify({
        text: 'socket.io error: ' + err,
      }));
    });

    socket.on('connect_error', function(err) {
      Api.setResponsePayload(JSON.stringify({
        text: 'socket.io connect error: ' + err,
      }));
    });
  }

  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

  function mnsInit() {

  };


  // Send a message request to the server
  function sendRequest(text, context) {
    if (socket) {
      // Build request payload
      var payloadToWatson = {};
      var payloadToImp = {};
      if (text) {
        payloadToWatson.input = {
          text: text
        };
        payloadToImp = {
          text: text
        }
      }
      if (context) {
        payloadToWatson.context = context;
      }
      socket.send(payloadToImp);

      var params = JSON.stringify(payloadToImp);
      // Stored in variable (publicly visible through Api.getRequestPayload)
      // to be used throughout the application
      if (Object.getOwnPropertyNames(payloadToImp).length !== 0) {
        Api.setRequestPayload(params);
      }
    }
  }
}());
