'use strict';
var async = require('async');
var R = require('ramda');
var log = require('winston');
var Template = require('./Template');

log.level = 'info';
const max_template_stack = 5;

module.exports = fulfill;

function fulfill(actions, context, responses, cb) {
  log.debug("fulfiller input response: " + responses);

  var constructTemplate = response => response.length > 0 ? new Template(actions, context, response) : "";
  var templates = R.map(constructTemplate, responses);

  var iterations = [];
  var checkFurtherActionsCb = (err, responses) => {
    log.debug("got responses: " + JSON.stringify(responses));
    iterations.push(responses);
    if (iterations.length <= max_template_stack && R.any(templateInstance, responses)) fulfillTemplates(responses, checkFurtherActionsCb);
    else {
      log.debug("fullfill final responses: " + JSON.stringify(responses));
      cb(err, responses);
    }
  };
  fulfillTemplates(templates, checkFurtherActionsCb);

}


var templateInstance = obj => obj instanceof Template;

function fulfillTemplates(templates, cb) {
  async.map(templates, function(template, innerCb) {
    if (templateInstance(template)) template.fulfill(innerCb);
    else innerCb(null, template);
  }, (err, responses) => {
    cb(err, responses);
  });
}
