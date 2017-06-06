'use strict';
const logger = require('../../lib/logging');
const fd = require('../../lib/football-data');
const _ = require('lodash');

module.exports = {
  controller: function(params) {
    return new Promise(function(resolve, reject) {
      const ws = params.context.current.workspace_id;
      const context = params.context.contexts[ws];
      const season = context.app.Season;
      const league = context.app.League;
      const filters = getFilters(params);
      filters.league = league;

      // fd.getAllFixtures(filters).then(function(res) {
      fd.getFixtures(season, filters).then(function(res) {
        if (res) {
          if (res.count == 0)
            resolve('No games that day.');
          let fixtureDate = new Date(res.fixtures[0].date);
          if (filters.filter) { // do it manually
            logger.debug('Example: ' + res.fixtures[0].date.substr(0, 10));
            const start = new Date(params.attributes.start);
            const end = new Date(params.attributes.end);
            res.fixtures = _.filter(res.fixtures, (o) => {
              const fixStart = new Date(o.date.substr(0, 10));
              return fixStart >= start && fixStart <= end;
            });
          }
          const today = new Date();
          const future = fixtureDate > today ? true : false;
          if (_.has(params, 'attributes.team')) { // filter by team
            if (_.has(params, 'attributes.team2'))
              res.fixtures = getTeamFixtures2(res.fixtures, future, params.attributes.team, params.attributes.team2);
            else
              res.fixtures = getTeamFixtures(res.fixtures, future, params.attributes.team);
          }
          res.fixtures = _.sortBy(res.fixtures, ['date']);
          if (_.has(params, 'attributes.limit')) { // limit number of results
            let nlimit = 99;
            if (!isNaN(nlimit = parseInt(params.attributes.limit)))
              res.fixtures = _.take(res.fixtures, nlimit);
          }
          if (res.fixtures.length == 0) // may have post processed them all away!
            resolve('I can\'t find anything.');
          else {
            fixtureDate = new Date(res.fixtures[0].date); // it may be changed by limit
            let currentDateStr = fixtureDate.toDateString();
            let build = [currentDateStr];
            res.fixtures.forEach((entry) => {
              const fixtureDate = new Date(entry.date);
              const fixtureDateStr = fixtureDate.toDateString();
              if (fixtureDateStr !== currentDateStr) {
                build.push(fixtureDateStr);
                currentDateStr = fixtureDateStr;
              }
              if (fixtureDate > today) {
                build.push(entry.homeTeamName + ' ' + entry.date.substr(11, 5) +
                  ' ' + entry.awayTeamName);
              } else
                build.push(entry.homeTeamName + ' ' + entry.result.goalsHomeTeam + '-' +
                  entry.result.goalsAwayTeam + ' ' + entry.awayTeamName);
            });
            // const reply = build.join('\u000A');
            const reply = build.join('<br/>');
            resolve(reply);
          }
        } else {
          resolve('Sorry I can\'t tell at the moment.');
        }
      }).catch(function(err) {
        reject(err);
      });
    }); // Promise
  },
};

// eslint-disable-next-line
function getFilters(params) {
  let filters = {};
  const isperiod = /^(n|p)[1-9][0-9]/.test(params.content);
  if (isperiod) {
    filters.timeFrame = params.content.substr(0, 3);
    return filters;
  }
  if (_.has(params, 'attributes.start')) {
    filters.timeFrameStart = params.attributes.start;
    filters.timeFrameEnd = params.attributes.start;
    if (params.attributes.end) {
      filters.timeFrameEnd = params.attributes.end;
      const st = new Date(filters.timeFrameStart);
      const end = new Date(filters.timeFrameEnd);
      const today = new Date();
      let diff = (end - st) / 86400000;
      if (diff > 21) {
        // api only supports 21 day intervals if larger than manually filter
        delete filters.timeFrameStart;
        delete filters.timeFrameEnd;
        filters.filter = true;
      }
    }
    return filters;
  }
  return filters;
}

function getTeamFixturesOld(fixtures, future, name) {
  const func = future ? _.find : _.findLast;
  const home = func(fixtures, {
    'homeTeamName': name,
  });
  const away = func(fixtures, {
    'awayTeamName': name,
  });
  if (home == null && away != null) {
    return [away];
  } else if (away == null && home != null) {
    return [home];
  } else if (away == null && home == null) {
    return [];
  } else {
    const h = new Date(home.date);
    const a = new Date(away.date);
    if (future ? a.getTime() > h.getTime() : a.getTime() < h.getTime())
      return [home];
    else {
      return [away];
    }
  }
}

function getTeamFixtures(fixtures, future, name) {
  const home = _.filter(fixtures, {
    'homeTeamName': name,
  });
  const away = _.filter(fixtures, {
    'awayTeamName': name,
  });
  return _.union(home, away);
}

function getTeamFixtures2(fixtures, future, name1, name2) {
  const home = _.filter(fixtures, {
    'homeTeamName': name1,
    'awayTeamName': name2,
  });
  const away = _.filter(fixtures, {
    'awayTeamName': name1,
    'homeTeamName': name2,
  });
  return _.union(home, away);
}
