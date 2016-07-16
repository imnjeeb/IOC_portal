'use strict';

module.exports = function (app) {

  var async = require("async");
  var request = require("request");
  var WebSocketClient = require('websocket').client;
  var client = new WebSocketClient();

  // configure
  var mapbox_token = app.mapbox.access_token;
  var serverUrl = app.serverUrl;

  ////////////////////////////////////////////////////////////////////////////
  // Renders Page
  ////////////////////////////////////////////////////////////////////////////
  app.get('/', callbackGetPage);

  ////////////////////////////////////////////////////////////////////////////
  // API
  ////////////////////////////////////////////////////////////////////////////
  app.get('/api/subscribers', callbackGetSubscribers);
  app.get('/api/events/id/:id/:limit?', callbackGetWebhookList);

  ////////////////////////////////////////////////////////////////////////////
  // Call back functions
  ////////////////////////////////////////////////////////////////////////////
  /* GET home page. */
  function callbackGetPage(req, res, next) {

    res.render('index', {
      title: 'IOCs',
      serverUrl: serverUrl,
      access_token: mapbox_token
    });
  }

  function callbackGetSubscribers(req, res) {
    var target = "subscribers",
        subscriberList = [];
    getRequestApi(target, function(d) {
      if (d.statusCode == 200) {
        subscriberList = d;
      }
      res.json(subscriberList);
    });
  }

  function callbackGetWebhookList(req, res) {
    var hardwareId = req.params.id,
        limit = req.params.limit || 0;
    var target = "camera/events?hardwareId="+hardwareId,
        eventsList = [];
    if (limit > 0) target+="&limit="+limit;
    console.log(target);
    getRequestApi(target, function(d) {
      if (d.statusCode == 200) {
        d.Data = JSON.parse(d.Data);
        eventsList = d;
      }
      res.json(eventsList);
    });
  }

  /**
   * To get data to connectedhome api
   */
  function getRequestApi(target, callback) {
    // timeout at 15 seconds
    var timeout = 15*10000;
    var path = "http://"+serverUrl+"/"+target;

    //console.log("path: " + path);
    return request.get({
      url: path,
      method: "GET",
      timeout: timeout
    }, function (error, response, body) {
      if (error) {
        var statusCode = 408;
        var errObj = {
          statusCode: statusCode,
          message: "Timeout!",
          Data: []
        };
        if (typeof response === "undefined") {
          callback(errObj);
        }

        statusCode=response.statusCode;
        callback({
          statusCode: statusCode || 400,
          message: body.error.toString(),
          Data: []
        });
      }
      //console.log("body",body);
      callback({
        statusCode: response.statusCode,
        message: "OK",
        Data: body
      })

    });
  }
};