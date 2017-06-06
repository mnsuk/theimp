'use strict';
const logger = require('../lib/logging');
const fulfill = require('../lib/fulfill');
const preActions = require('../preActions');

/**
 * Use fulfill module as enrichment framework to prepopulate context prior
 * to calling conversation (typically for open ended entities).
 *
 * @param {object} bot
 * @param {object} update
 * @param {next} next
 *
 */
module.exports = function(bot, update, next) {
  const ws = update.sessions.current.workspace_id;
  const myContext = update.sessions.contexts[ws];
  const inArray = myContext ? myContext.preAction ? [myContext.preAction] : [] : [];
  if (inArray.length > 0) {
    // need to construct an input for fulfill that has both the action and the text input
    // use <theaction>thetextinput</theaction>
    let submitArray = [];
    inArray.forEach((item) => {
      submitArray.push(item.substr(0, item.indexOf('>') + 1) + update.message.text + item.substr(item.indexOf('>') + 1));
    });
    fulfill(
      preActions,
      update.sessions.contexts[ws],
      submitArray,
      function(err, finalText) {
        next();
      }
    );
  } else
    next();
};
