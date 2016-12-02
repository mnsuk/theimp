'use strict';

var express  =  require('express');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var csrf = require('csurf');
var cfenv = require('cfenv');
var config = require('config');
var request = require('request'); //new

module.exports = function(app) {
  // set appEnv as global (including vcap_services) from cf or local as appropriate
  var vcap_services=config.get('VCAP_SERVICES');
  var envOptions= {vcap: { services: vcap_services}};
  global.appEnv = cfenv.getAppEnv(envOptions);

  app.use(helmet());
  app.use(bodyParser.urlencoded({ extended: true }));
  // need to get the domain from the appEnv url to set the cookie to allow two websites
  var sessionEnv = {
    cookieName: 'session',
    secret: 'gsjdhhslfhflhlkhlfyuiufr',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000};
  if (!appEnv.isLocal) {
    sessionEnv.cookie = {domain: '.eu-gb.mybluemix.net'};
  }
  app.use(session(sessionEnv));
  app.use(csrf());
  app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
      // handle CSRF token errors here
        res.status(403)
        res.send('This page has expired, please login again.')
  });
  app.use(express.static(__dirname + '/../public'));
  //app.set('view engine', 'jade');
  app.locals.pretty = true;

  //app.use(require('../middlewares/user'));
  //app.use(require('../controllers'));
};
