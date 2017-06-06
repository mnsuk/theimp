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
          context.app.OtherTeam = res.standing[0].teamName;
          let reply = '';
          if (res.standing[0].teamName == params.content) {
            reply = 'Congratulations, you are top with ' + res.standing[0].points + ' points.';
          } else if (season == context.app.Season) {
            reply = 'Sorry to say ' + res.standing[0].teamName + ' are top with ' +
              res.standing[0].points + ' points.';
          } else {
            reply = res.standing[0].teamName + ' are top with ' +
              res.standing[0].points + ' points.';
          }
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
