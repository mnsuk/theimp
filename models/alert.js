const logger = require('../lib/logging');
const _ = require('lodash');
const Cloudant = require('cloudant');
const config = require('config');
const cloudant = Cloudant({ // eslint-disable-line new-cap
  instanceName: 'ibmwatson-nlc-cloudant',
  vcapServices: global.appEnv.services,
});
const db = cloudant.db.use(config.get('botmasterDB'));

// eslint-disable-next-line no-unused-vars
const Alert = module.exports = function(id, scope, type, bot) {
  this.id = id;
  this.scope = scope;
  this.type = type;
  this.bot = bot;
};

const create = module.exports.create = function(alert, cb) {
  logger.debug('alert model create');
  db.get('alerts', function(err, doc) {
    if (!err) {
      doc.users.push(alert);
      db.insert(doc, function(err, body) {
        if (err) {
          if (err.statusCode === 409) {
            err = new Error('alert update error');
          }
          cb(err);
        } else {
          cb(null, body.id);
        }
      });
    } else {
      if (err.statusCode === 404)
        cb(null, null); // user not found
      else {
        cb(err);
      }
    }
  });
};

const del = module.exports.delete = function(id, cb) {
  logger.debug('alert model delete');
  db.get('alerts', function(err, doc) {
    if (!err) {
      const newusers = _.remove(doc.users, (u) => {
        return u.id != id;
      });
      doc.users = newusers;
      db.insert(doc, function(err, body) {
        if (err) {
          if (err.statusCode === 409) {
            err = new Error('alert delete error');
          }
          cb(err);
        } else {
          cb(null, body.id);
        }
      });
    } else {
      if (err.statusCode === 404)
        cb(new Error('couldn\'t read existing alerts'));
      else {
        cb(err);
      }
    }
  });
};

module.exports.getAll = function(cb) {
  db.get('alerts', function(err, doc) {
    if (!err) {
      cb(null, doc.users);
    } else {
      if (err.statusCode === 404)
        cb(new Error('couldn\'t read existing alerts'));
      else {
        cb(err);
      }
    }
  });
};

module.exports.upsert = function(alert, cb) {
  logger.debug('alert model upsert');
  del(alert.id, function(err, id) {
    logger.debug('deleted: ' + alert.id);
    if (!err) {
      if (id) {
        create(alert, cb);
      } else {
        cb(new Error('alert update error.'));
      }
    } else {
      cb(err);
    }
  })
};

/*
 * At the end of the day delete the type 4 alerts
 * as these are active for just one day
 */
module.exports.endOfDay = function(cb) {
  logger.debug('alert model endOfDay');
  db.get('alerts', function(err, doc) {
    if (!err) {
      const newusers = _.remove(doc.users, (u) => {
        return u.type != '4';
      });
      doc.users = newusers;
      db.insert(doc, function(err, body) {
        if (err) {
          if (err.statusCode === 409) {
            err = new Error('alert endOfDay error');
          }
          cb(err);
        } else {
          cb(null, body.id);
        }
      });
    } else {
      if (err.statusCode === 404)
        cb(new Error('couldn\'t read existing alerts at endOfDay'));
      else {
        cb(err);
      }
    }
  });
};
