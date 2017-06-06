'use strict';
const fd = require('../../lib/football-data');
const _ = require('lodash');

module.exports = {
  controller: function(params) {
    return new Promise(function(resolve, reject) {
      const ws = params.context.current.workspace_id;
      const context = params.context.contexts[ws];
      let season = context.app.Season;
      if (_.has(params, 'attributes.competition'))
        season = params.attributes.competition;
      fd.getLeagueTable(season).then(function(res) {
        let build = ['<b>Team&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Games&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Points</b>'];
        if (res != null) {
          res.standing.forEach((entry) => {
            build.push(entry.teamName + ' ' + entry.playedGames + ' ' + entry.points);
          });
          const reply = build.join('<br/>');
          resolve(reply);
        } else {
          resolve('Sorry I can\'t tell at the moment.');
        }
      }).catch(function(err) {
        reject(err);
      });
    });
  },
};
