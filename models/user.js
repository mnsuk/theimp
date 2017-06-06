const bcrypt = require('bcryptjs');
const logger = require('../lib/logging');
const Cloudant = require('cloudant');
const config = require('config');
const cloudant = Cloudant({ // eslint-disable-line new-cap
  instanceName: 'ibmwatson-nlc-cloudant',
  vcapServices: global.appEnv.services,
});
const db = cloudant.db.use(config.get('authenticationDB'));

// eslint-disable-next-line no-unused-vars
const User = module.exports = function(id, fn, ln, pw, tok) {
  this._id = id;
  this.firstName = fn;
  this.lastName = ln;
  this.password = pw;
  this.validationToken = tok;
};

module.exports.create = function(user, cb) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, function(err, hash) {
      user.password = hash;
      user.count = 1;
      user.lastLogin = new Date();
      user.admin = false;
      user.validated = false;
      db.insert(user, function(err, body) {
        if (err) {
          if (err.statusCode === 409) {
            err = new Error('That email is already taken');
          }
          cb(err);
        } else {
          cb(null, body.id);
        }
      });
    });
  });
};

module.exports.getById = function(id, cb) {
  db.get(id, function(err, doc) {
    if (!err)
      cb(null, doc);
    else {
      if (err.statusCode === 404)
        cb(null, null); // user not found
      else {
        cb(err);
      }
    }
  });
};

module.exports.getPublicById = function(id, cb) {
  db.get(id, function(err, doc) {
    if (!err) {
      delete doc.password;
      cb(null, doc);
    } else {
      if (err.statusCode === 404)
        cb(null, null); // user not found
      else {
        cb(err);
      }
    }
  });
};

module.exports.update = function(user, cb) {
  db.insert(user, function(err, body) {
    if (err) {
      if (err.statusCode === 409) {
        err = new Error('That email is already taken');
      }
      cb(err);
    } else {
      user._rev = body.rev;
      cb(null, user);
    }
  });
};

module.exports.comparePassword = function(candidate, hash, cb) {
  bcrypt.compare(candidate, hash,
    function(err, isMatch) {
      if (err) {
        logger.debug('Match error:' + JSON.stringify(err));
        cb(err);
      } else {
        logger.debug('Match answered:' + isMatch);
        cb(null, isMatch);
      }
    });
};
