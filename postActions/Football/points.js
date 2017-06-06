'use strict';
const fd = require('../../lib/football-data');
const _ = require('lodash');
const ordinals = {
  1: 'top',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'eigth',
  9: 'ninth',
  10: 'tenth',
  11: 'eleventh',
  12: 'twelth',
  13: 'thirteenth',
  14: 'fourteenth',
  15: 'fifteenth',
  16: 'sixteenth',
  17: 'seventeenth',
  18: 'eighteenth',
  19: 'nineteenth',
  20: 'bottom',
};

module.exports = {
  controller: function(params) {
    return new Promise(function(resolve, reject) {
      const ws = params.context.current.workspace_id;
      const context = params.context.contexts[ws];
      const season = context.app.Season;
      const query = params.content;
      const isnum = /^\d+$/.test(query);
      if (isnum) {
        fd.getLeagueTable(season).then(function(res) {
          let ans = _.find(res.standing, {
            'position': parseInt(query),
          });
          context.app.OtherTeam = ans.teamName;
          resolve(ans.teamName + ' are ' + ordinals[ans.position] + ' with ' +
            ans.points.toString() + ' points.');
        }).catch(function(err) {
          reject(err);
        });
      } else {
        fd.getLeagueTable(season).then(function(res) {
          let ans = _.find(res.standing, {
            'teamName': query,
          });
          resolve(ans.teamName + ' are ' + ordinals[ans.position] + ' with ' +
            ans.points.toString() + ' points.');
        }).catch(function(err) {
          reject(err);
        });
      }
    });
  },
};
