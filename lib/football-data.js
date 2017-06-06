'use strict';
/**
 * @module  football-data
 * Wrapper to football-data.org api
 */
const rp = require('request-promise');
const _ = require('lodash');
const config = require('config');
const fdApi = config.get('football-data');

const fd = new FootballData();

// eslint-disable-next-line require-jsdoc
function FootballData() {
  if (!(this instanceof FootballData))
    return new FootballData();
  this.apiToken = fdApi.token;
  this.apiUrl = fdApi.url;
}

FootballData.prototype.getRequest = function(path) {
  return {
    uri: this.apiUrl + path,
    headers: {
      'X-Auth-Token': this.apiToken,
    },
    json: true,
  };
};

FootballData.prototype.getCompetitions = function(filter) {
  const config = this.getRequest('/v1/competitions/');
  config.qs = _getQS(['season'], filter);
  return rp(config);
};

FootballData.prototype.getCompetitionById = function(competitionId) {
  return rp(this.getRequest('/v1/competitions/' + competitionId));
};

FootballData.prototype.getTeamsInCompetition = function(competitionId) {
  return rp(this.getRequest('/v1/competitions/' + competitionId + '/teams'));
};

FootballData.prototype.getLeagueTable = function(competitionId, filter) {
  const config = this.getRequest('/v1/competitions/' + competitionId + '/leagueTable');
  if (filter)
    config.qs = _getQS(['matchday'], filter);
  return rp(config);
};

FootballData.prototype.getFixtures = function(competitionId, filter) {
  const config = this.getRequest('/v1/competitions/' + competitionId + '/fixtures');
  if (filter)
    config.qs = _getQS(['matchday', 'timeFrame', 'timeFrameStart', 'timeFrameEnd'], filter);
  return rp(config);
};

FootballData.prototype.getAllFixtures = function(filter) {
  const config = this.getRequest('/v1/fixtures');
  if (filter)
    config.qs = _getQS(['league', 'timeFrame', 'timeFrameStart', 'timeFrameEnd'], filter);
  return rp(config);
};

FootballData.prototype.getFixture = function(fixtureId, filter) {
  const config = this.getRequest('/v1/fixtures/' + fixtureId);
  if (filter)
    config.qs = _getQS(['head2head'], filter);
  return rp(config);
};

FootballData.prototype.getTeamFixtures = function(teamId, filter) {
  const config = this.getRequest('/v1/teams/' + teamId + '/fixtures');
  if (filter)
    config.qs = _getQS(['season', 'timeFrame', 'venue'], filter);
  return rp(config);
};

FootballData.prototype.getTeamById = function(teamId) {
  return rp(this.getRequest('/v1/teams/' + teamId));
};

FootballData.prototype.getTeamByName = function(teamName) {
  const config = this.getRequest('/v1/teams');
  config.qs = {
    name: teamName,
  };
  return rp(config);
};

FootballData.prototype.getTeamPlayers = function(teamId) {
  return rp(this.getRequest('/v1/teams/' + teamId + '/players'));
};

/**
 * Return valid query string for a given filter request
 * @param {array} validFilters - all possible valid filters
 * @param {object} filters - requested filters
 * @return {object|undefined} - valid query string
 */
function _getQS(validFilters, filters) {
  let qs = {};
  validFilters.forEach((validFilter) => {
    if (_.has(filters, validFilter))
      qs[validFilter] = filters[validFilter];
  });
  if (_.size(qs) > 0)
    return (qs);
}

/** Entry for football-date.org api */
module.exports = fd;
