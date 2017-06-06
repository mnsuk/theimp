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
          // ouch! assume all leagues have a relegation bottom three.
          const rel = _.drop(res.standing, res.standing.length - 3);
          if (params.content != null && params.content != '') {
            // eslint-disable-next-line max-len
            const myteam = params.content === context.app.MyTeam ? true : false;
            let danger = false;
            for (let i = 0; i < rel.length; i++) {
              if (rel[i].teamName === params.content) {
                danger = true;
                break;
              }
            }
            // eslint-disable-next-line max-len
            const dropmsg = myteam ? 'Unfortunately you\'re in the zone, and not in a good way.' : 'They are in the bottom three.';
            const safemsg = myteam ? 'You\'re safe.' : 'They\'re clear of the bottom.';
            if (danger) {
              resolve(dropmsg);
            } else {
              resolve(safemsg);
            }
          } else {
            rel.forEach((item) => {})
            const reply = 'Heading down are ' + rel[0].teamName + ', ' +
              rel[1].teamName + ' and ' + rel[2].teamName + ' bringing up the bottom.';
            resolve(reply);
          }
        } else {
          resolve('Sorry I can\'t tell at the moment.');
        }
      }).catch(function(err) {
        reject(err);
      });
    });
  },
};
