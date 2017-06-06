'use strict';
const logger = require('../lib/logging');
const config = require('config');
const Cloudant = require('cloudant');
const cloudant = Cloudant({ // eslint-disable-line new-cap
  instanceName: 'ibmwatson-nlc-cloudant',
  vcapServices: global.appEnv.services,
});
const db = cloudant.db.use(config.get('botmasterDB'));
const _ = require('lodash');

/**
 * Retrieve botmaster session
 *
 * @param {object} bot
 * @param {object} update
 * @param {next} next
 *
 */
function retrieveSession(bot, update, next) {
  if (_.has(update, 'postback.payload')) {
    update.message = {
      text: update.postback.payload,
    }; // frigit for buttons as label is payload not text
  }
  let dbId = update.sender.id;
  if (bot.type == 'socketio') {
    dbId = update.sender.id.replace(/-AT-/, '@');
    dbId = dbId.replace(/-DOT-/g, '.');
  }

  db.get(dbId, (err, doc) => {
    if (!err) {
      update.sessions = doc.sessions;
      update.sessions._rev = doc._rev; // update the revision
      // ensure lastest global application environment gets copied to
      // selected context (need this to cope with updates and /use)
      // if it's new, then init.
      const ws = update.sessions.current.workspace_id;
      if (typeof update.sessions.contexts[ws] !== 'undefined') { // it may be new an uninitialised
        update.sessions.contexts[ws].env = update.sessions.current.env;

        if (!update.profile) { // temp to gather full profile details
          if (bot.type == 'messenger') {
            bot.getUserInfo(update.sender.id).then((res) => {
              update.profile = {
                firstName: res.first_name,
                lastName: res.last_name,
                botType: 'messenger',
              };
              next();
            });
          } else {
            if (bot.type == 'socketio') {
              if (_.has(update.raw, 'socket.user.firstName')) {
                update.profile = {
                  firstName: update.raw.socket.user.firstName,
                  lastName: update.raw.socket.user.lastName,
                  botType: 'socketio',
                };
              }
            }
            next();
          }
        }
        // end of temp
        next();
      } else {
        if (_.has(update.sessions, 'current.env'))
          update.sessions.contexts[ws] = {
            env: update.sessions.current.env,
          };
        else {
          update.sessions.current.env = {};
          update.sessions.contexts[ws] = {
            env: {},
          };
        }
        if (bot.type == 'messenger') {
          bot.getUserInfo(update.sender.id).then((res) => {
            logger.debug('fb user: ' + JSON.stringify(res));
            update.sessions.current.env.callme = res.first_name;
            update.sessions.contexts[ws].env.callme = res.first_name;
            update.profile = {
              firstName: res.first_name,
              lastName: res.last_name,
              botType: 'messenger',
            };
            next();
          });
        } else {
          if (bot.type == 'socketio') {
            if (_.has(update.raw, 'socket.user.firstName')) {
              update.sessions.current.env.callme = update.raw.socket.user.firstName;
              update.sessions.contexts[ws].env.callme = update.raw.socket.user.firstName;
              update.profile = {
                firstName: update.raw.socket.user.firstName,
                lastName: update.raw.socket.user.lastName,
                botType: 'socketio',
              };
              update.sessions.current.env.callme = update.raw.socket.user.firstName;
              logger.debug('socket user: ' + JSON.stringify(update.raw.socket.user));
            }
          }
          next();
        }
      }
    } else {
      const ws = config.get('masterWorkspace');
      if (err.statusCode === 404) {
        logger.warn('user not found.');
        update.sessions = {
          _id: update.sender.id,
          contexts: {},
          current: {
            workspace_id: ws,
            env: {},
          },
        };
        if (bot.type == 'messenger') {
          bot.getUserInfo(update.sender.id).then((res) => {
            logger.debug('fb user: ' + JSON.stringify(res));
            update.sessions.contexts[ws] = {
              env: {
                callme: res.first_name,
              },
            };
            update.sessions.current.env.callme = res.first_name;
            update.profile = {
              firstName: res.first_name,
              lastName: res.last_name,
              botType: 'messenger',
            };
            next();
            // return;
          });
        } else {
          if (bot.type == 'socketio') {
            if (_.has(update.raw, 'socket.user.firstName')) {
              update.sessions.contexts[ws] = {
                env: {
                  callme: update.raw.socket.user.firstName,
                },
              };
              update.profile = {
                firstName: update.raw.socket.user.firstName,
                lastName: update.raw.socket.user.lastName,
                botType: 'socketio',
              };
              update.sessions.current.env.callme = update.raw.socket.user.firstName;
              logger.debug('socket user: ' + JSON.stringify(update.raw.socket.user));
            }
          }
          next();
        }
      } else {
        logger.warn('retrieve error: ' + err.statusCode +
          ' ' + err.error + ' ' + err.reason);
        update.sessions = {
          _id: update.sender.id,
          contexts: {},
          current: {
            workspace_id: ws,
            env: {},
          },
        };
        if (bot.type == 'messenger') {
          bot.getUserInfo(update.sender.id).then((res) => {
            logger.debug('fb user: ' + JSON.stringify(res));
            update.sessions.contexts[ws] = {
              env: {
                callme: res.first_name,
              },
            };
            update.sessions.current.env.callme = res.first_name;
            update.profile = {
              firstName: res.first_name,
              lastName: res.last_name,
              botType: 'messenger',
            };
            next();
            // return;
          });
        } else {
          if (bot.type == 'socketio') {
            if (_.has(update.raw, 'socket.user.firstName')) {
              update.sessions.contexts[ws] = {
                env: {
                  callme: update.raw.socket.user.firstName,
                },
              };
              update.profile = {
                firstName: update.raw.socket.user.firstName,
                lastName: update.raw.socket.user.lastName,
                botType: 'socketio',
              };
              update.sessions.current.env.callme = update.raw.socket.user.firstName;
              logger.debug('socket user: ' + JSON.stringify(update.raw.socket.user));
            }
          }
          next();
        }
      }
    }
  });
}

/**
 * Store botmaster session
 *
 * @param {object} bot
 * @param {object} outmsg
 * @param {next} next
 *
 */
function updateSession(bot, outmsg, next) {
  if (!outmsg.sessions) { // raw message
    next();
    return;
  }
  logger.silly('updateSession() persisting: ' + JSON.stringify(outmsg.sessions));
  let dbId = outmsg.sessions._id;
  if (bot.type == 'socketio') {
    dbId = outmsg.sessions._id.replace(/-AT-/, '@');
    dbId = dbId.replace(/-DOT-/g, '.');
  }
  const p = {
    _id: dbId, // same as outmsg.recipient.id !!
    sessions: outmsg.sessions,
    profile: outmsg.profile,
  };
  // is this an update or an insert?
  if (outmsg.sessions._rev) p._rev = outmsg.sessions._rev;
  // ensure global application environment gets update in case app has modified
  const ws = p.sessions.current.workspace_id;
  if (typeof p.sessions.contexts[ws] !== 'undefined') // it may be new an uninitialised
    p.sessions.current.env = p.sessions.contexts[ws].env;

  db.insert(p, (err, doc) => {
    if (err) {
      if (err.statusCode === 409) {
        logger.warn('That email is already taken');
      } else {
        logger.warn('Database update error');
      }
    }
    delete outmsg.sessions;
    delete outmsg.profile;
    next();
  });
}

module.exports = {
  retrieveSession: retrieveSession,
  updateSession: updateSession,
};
