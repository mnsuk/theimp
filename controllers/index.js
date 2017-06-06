const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const requireAuth = require('../middlewares/requireAuth');
const config = require('config');
const logger = require('../lib/logging');

router.get('/', function(req, res) {
  res.render('index');
});

router.use('/', require('./user'));

router.get('/chat', function(req, res) {
  res.render('chat', {
    csrfToken: req.csrfToken(),
    impsvc: config.get('imp-svc'),
  });
});

router.get('/privacy', function(req, res) {
  res.render('privacy');
});

// Fix to allow bluemix to iFrame https in http and avoid X-Frame-Options errors.
router.get('/help',
  function(req, res, next) {
    res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + global.appEnv.url);
    next();
  },
  function(req, res) {
    res.render('help');
  });


router.get('/debug', requireAuth, function(req, res) {
  const sessionEnv = {
    cookieName: 'session',
    secret: 'gsjdhhslfhflhlkhlfyuiufr',
  };
  const session = require('client-sessions');
  const Cookies = require('cookies');
  const cookies = new Cookies(req, res);

  logger.debug('req.session: ' + JSON.stringify(req.session));
  logger.debug('req.user: ' + JSON.stringify(req.user));
  logger.debug('decode: ' + JSON.stringify(session.util.decode(sessionEnv, cookies.get('session'))));
  //logger.debug('autheintcated: ' + req.isAuthenticated);
  res.render('debug', {
    csrfToken: req.csrfToken(),
    info_msg: ['a sample message', 'another'],
    warn_msg: ['a sample message', 'another'],
    success_msg: ['a sample message', 'another'],
    error_msg: ['a sample message', 'another'],
  });
});

router.get('/fatal', function(req, res) {
  res.render('fatal');
});

module.exports = router;
