const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const requireAuth = require('../middlewares/requireAuth');

router.get('/', function(req, res) {
  res.render('index');
});

router.use('/', require('./user'));

router.get('/debug', requireAuth, function(req, res) {
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
