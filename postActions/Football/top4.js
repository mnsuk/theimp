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
        if (res != null) {
          const t4 = _.take(res.standing, 4);
          const reply = t4[0].teamName + ' are top with ' + t4[0].points +
            ' points, followed by ' + t4[1].teamName + ' (' + t4[1].points + ' pts), ' +
            t4[2].teamName + ' (' + t4[2].points + ') and  ' +
            t4[3].teamName + ' (' + t4[3].points + ').';
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
