const extend = require('extend');
const passport = require('passport');
const logger = require('../lib/logging');
const session = require('client-sessions');
const User = require('../models/user');
const _ = require('lodash');


module.exports = function(options) {
  let defaults = {
    cookieName: null,
    secret: null,
    success: function(data, next) {
      next();
    },
    fail: function(data, type, message, next) {
      let e = new Error(message);
      e.name = type;
      next(e);
    }
  };
  const conf = extend(defaults, options);
  return function(data, next) {
    if (_.has(data.request.headers, 'cookie.' + conf.cookieName)) {
      const sess = session.util.decode({
        cookieName: conf.cookieName,
        secret: conf.secret,
      }, data.request.headers.cookie[conf.cookieName]);
      if (_.has(sess, 'content.passport.user')) {
        User.getPublicById(sess.content.passport.user, function(err, user) {
          if (err) {
            logger.warn('User.getPublicById database error: ' + JSON.stringify(err));
            return conf.fail(data, 'DB_ERR', 'User.getPublicById database error: ' + err.message, next);
          }
          if (!user) {
            logger.warn('Unknown user' + JSON.stringify(err));
            return conf.fail(data, 'AUTH', 'Unknown user', next);
          } else {
            logger.debug('passportSocket user: ' + user._id);
            data.user = user;
            return conf.success(data, next);
          }
        });
      } else {
        return conf.fail(data, 'AUTH', 'No user logged in.', next);
      }
    } else {
      return conf.fail(data, 'AUTH', 'No user session logged in.', next);
    }
  };
};
