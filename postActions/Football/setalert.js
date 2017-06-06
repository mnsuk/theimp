'use strict';
const _ = require('lodash');
const logger = require('../../lib/logging');
const Alert = require('../../models/alert');


module.exports = {
  controller: function(params) {
    return new Promise(function(resolve, reject) {
      const ws = params.context.current.workspace_id;
      const context = params.context.contexts[ws];
      const query = params.content;

      let team = 'All'
      if (params.attributes.team == '1')
        team = context.app.MyTeam;
      const alert = new Alert(params.context._id, team, params.attributes.choice,
        guessBotType(params.context._id));
      Alert.upsert(alert, function(err, body) {
        if (err)
          reject(err);
        else {
          let txt = 'You\'ll be alerted with the ';
          switch (params.attributes.choice) {
            case '1':
              txt += 'results for ';
              break;
            case '2':
              txt += 'goals and results for ';
              break;
            case '3':
              txt += 'kick-off, goals and results for ';
              break;
            case '4':
              txt += 'kick-off, goals and results today only for ';
              break;
          }
          if (team == 'All')
            txt += 'all teams in the league.'
          else {
            txt += team + '.';
          }
          resolve(txt);
        }
      });
    });
  },
};

/*
 * need to work out channel user is communicating on
 * and don't have bm object. This will do for now
 */
function guessBotType(id) {
  if (isNaN(id))
    return ('socketio'); // it's got @ and . in it.
  else {
    return ('messenger'); // pure digits
  }
}
