'use strict';
const logger = require('./logging');
const utils = require('./utils');
const _ = require('lodash');
const Alert = require('../models/alert');

/* subscription: { id: 'x', type: n , scope: 'x'}
 * id: facebook sender id
 * type: 1 = results, 2 = results & goals, 3 = results, goals & Kick-off
 * 4 = results, goals & kick-off for today only.
 * scope: All or valid team name.
 */

const _subscriptions = function _subscriptions() {
  let _subs = [];
  const MyConstructor = function() {
    this.getSubs = function() {
      return _subs;
    };
    this.hits = function(changeType, club, bot) {
      return _.filter(_subs, (o) => {
        return changeType <= o.type && o.scope == club && o.bot == bot;
      });
    };
    this.load = function() {
      Alert.getAll(function(err, users) {
        _subs = users;
      });
    };
  };
  const _myInstance = new MyConstructor();
  _myInstance.load();
  return _myInstance;
};

let subscriptions = _subscriptions();


module.exports = function send(fbBot, alerts) {
  const typeGroups = _.groupBy(alerts, (o) => {
    return o.type;
  });
  if (typeGroups['1']) {
    let output = [];
    output.push('Results just in:');
    typeGroups['1'].forEach((ent) => {
      output.push(ent.fixture.homeTeamName + ' ' +
        ent.fixture.result.goalsHomeTeam + '-' +
        ent.fixture.result.goalsAwayTeam + ' ' + ent.fixture.awayTeamName);
      const a = subscriptions.hits('1', ent.fixture.homeTeamName, fbBot.type);
      const b = subscriptions.hits('1', ent.fixture.awayTeamName, fbBot.type);
      const inform = _.union(a, b);
      if (inform) {
        inform.forEach((sub) => {
          const resOut = 'Results just in:<br/>' + ent.fixture.homeTeamName + ' ' +
            ent.fixture.result.goalsHomeTeam + '-' +
            ent.fixture.result.goalsAwayTeam + ' ' + ent.fixture.awayTeamName;
          logger.silly('To: ' + sub.id + ' ' + resOut);
          utils.sendRawFbMessage(fbBot, sub.id, resOut);
        });
      }
    });
    const resOut = output.join('<br/>');
    const inform = subscriptions.hits('1', 'All', fbBot.type);
    if (inform) {
      inform.forEach((sub) => {
        logger.silly('To: ' + sub.id + ' ' + resOut);
        utils.sendRawFbMessage(fbBot, sub.id, resOut);
      });
    }
  }
  if (typeGroups['2']) {
    let output = [];
    output.push('Goal!');
    typeGroups['2'].forEach((ent) => {
      output.push(ent.fixture.homeTeamName + ' ' +
        ent.fixture.result.goalsHomeTeam + '-' +
        ent.fixture.result.goalsAwayTeam + ' ' + ent.fixture.awayTeamName);
      const a = subscriptions.hits('2', ent.fixture.homeTeamName, fbBot.type);
      const b = subscriptions.hits('2', ent.fixture.awayTeamName, fbBot.type);
      const inform = _.union(a, b);
      if (inform) {
        inform.forEach((sub) => {
          const resOut = 'Goal!<br/>' + ent.fixture.homeTeamName + ' ' +
            ent.fixture.result.goalsHomeTeam + '-' +
            ent.fixture.result.goalsAwayTeam + ' ' + ent.fixture.awayTeamName;
          logger.silly('To: ' + sub.id + ' ' + resOut);
          utils.sendRawFbMessage(fbBot, sub.id, resOut);
        });
      }
    });
    const resOut = output.join('<br/>');
    const inform = subscriptions.hits('2', 'All', fbBot.type);
    if (inform) {
      inform.forEach((sub) => {
        logger.silly('To: ' + sub.id + ' ' + resOut);
        utils.sendRawFbMessage(fbBot, sub.id, resOut);
      });
    }
  }
  if (typeGroups['3']) {
    let output = [];
    output.push('Kick-off');
    typeGroups['3'].forEach((ent) => {
      output.push(ent.fixture.homeTeamName + ' v ' + ent.fixture.awayTeamName);
      const a = subscriptions.hits('3', ent.fixture.homeTeamName, fbBot.type);
      const b = subscriptions.hits('3', ent.fixture.awayTeamName, fbBot.type);
      const inform = _.union(a, b);
      if (inform) {
        inform.forEach((sub) => {
          const resOut = 'Kick-off<br/>' + ent.fixture.homeTeamName +
            ' v ' + ent.fixture.awayTeamName;
          logger.silly('To: ' + sub.id + ' ' + resOut);
          utils.sendRawFbMessage(fbBot, sub.id, resOut);
        });
      }
    });
    const resOut = output.join('<br/>');
    const inform = subscriptions.hits('3', 'All', fbBot.type);
    if (inform) {
      inform.forEach((sub) => {
        logger.silly('To: ' + sub.id + ' ' + resOut);
        utils.sendRawFbMessage(fbBot, sub.id, resOut);
      });
    }
  }
};

module.exports.reload = function() {
  subscriptions = _subscriptions();
};
