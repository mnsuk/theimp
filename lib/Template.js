/**
 *  A Template is created from a set of functions actions and a response string where those actions can be found as xml tags.
 *  It can be fulfilled by exectuting the actions, which receive any content and attributes of those xml tags as well as the context object
 *  The result of the action can:
 *   - replace the tag with new content
 *   - create a new response string
 *   - modify the context.
 */

var cheerio = require("cheerio");
var R = require("ramda");
var log = require("winston");
var async = require("async");
var Promise = require("bluebird");

log.level = 'info';

function Template(actions, context, responseString) {
  this.text = responseString;
  this.context = context;
  this.xml = loadAsXml(responseString); // load Response string in cheerio
  this.allActions = actions;
  this.actions = prepareActions(this.xml, actions);
  var stringifyActions = {
    actions: R.keys,
    allActions: R.keys
  }
  log.debug('Created Template: ' + JSON.stringify(R.evolve(stringifyActions, this)));
}

Template.prototype.updateXml = function(el, response) {
  this.xml(el).replaceWith(response);
  log.debug("got response: '" + response + "'. xml is now: " + this.xml.html());
}

Template.prototype.getUpdateCb = function(el, cb) {
  return (err, response) => {
    if (!err) this.updateXml(el, response);
    cb(err, response)
  };
}


Template.prototype.fulfillAction = function(action, cb) {
  var async_tasks = [];
  var eval_count = 0;
  var actionSpec = this.actions[action]
  var controller = actionSpec.controller
    // for each tag that we find matches the action
  this.xml(action).each((i, el) => {
    eval_count++;
    // load the element with cheerio
    var elXml = this.xml(el)
    var action_params = {
      context: this.context,
      attributes: elXml.attr(),
      content: elXml.html()
    };
    log.debug("sending params to action controller: " + JSON.stringify(action_params))
    if (controller.length == 1) {
      var response = controller(action_params);
      async_tasks.push(cb => Promise.resolve(response).asCallback(this.getUpdateCb(el, cb)));
    } else {
      // supply the params
      var task = cb => {
          controller(action_params, this.getUpdateCb(el, cb));
        }
        // add it to the task array
      async_tasks.push(task);
    }
  });
  const innerCb = (err, responses) => {
    if (actionSpec.replace == 'first') this.xml = loadAsXml(responses.shift());
    else if (actionSpec.replace == 'last') this.xml = loadAsXml(responses.pop());
    else if (actionSpec.replace == 'join') this.xml = loadAsXml(responses.join());
    cb(err, responses)
  }
  if (actionSpec.series) async.series(async_tasks, innerCb);
  else async.parallel(async_tasks, innerCb);

};

Template.prototype.fulfill = function(cb) {
  var responses = [];
  var async_tasks = [];
  for (var action in this.actions) {
    var task = R.curry(R.bind(this.fulfillAction, this))(action)
    async_tasks.push(task);
  }
  log.debug("types of actions to fulfill: " + async_tasks.length)
  async.parallel(async_tasks, (err, data) => {
    var final_response = this.xml.html();
    var new_template = new Template(this.allActions, this.context, final_response);
    log.debug("got response: " + final_response + " for template: " + this.text)
    if (R.keys(new_template.actions).length === 0) cb(err, final_response);
    else cb(err, new_template);
  });
};

// test for whether the action is in a loaded cheerio obj
var actionApplies = R.curry(($, action) => $(action.name).length > 0);

function prepareActions($, actions) {
  actions = R.clone(actions); // perf warning
  for (var action in actions) {
    actions[action].name = action
  }
  return R.filter(actionApplies($), actions); // object of all pending actions
}

/*
 *  Load a String representing the response using cheerio and return the cheerio object
 */
function loadAsXml(responseString) {
  return cheerio.load(responseString, {
    xmlMode: true,
    normalizeWhitespace: false,
    decodeEntities: false,
    withDomLvl1: false
  });
}

module.exports = Template;
