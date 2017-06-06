'use strict';
const logger = require('../lib/logging');
const config = require('config');
const Cloudant = require('cloudant');
const cloudant = Cloudant({ // eslint-disable-line new-cap
  instanceName: 'ibmwatson-nlc-cloudant',
  vcapServices: global.appEnv.services,
});
const db = cloudant.db.use(config.get('botmasterDB'));
const _ = require('lodash');
const watson = require('watson-developer-cloud');
const extend = require('extend');
// eslint-disable-next-line max-len
const watsonConversation = watson.conversation(extend(global.appEnv.getService('Conversation').credentials, {
  version: 'v1',
  version_date: '2016-09-20',
}));


/*
 * use - to swtich between workspaces
 * attributes
 *    silent = true  - do not echo the command
 *    poke = true  - send a ' ' to the new workspace
 */
module.exports = {
  controller: function(params, cb) {
    // first sync any env changes;
    const origWs = params.context.current.workspace_id;
    params.context.current.env = params.context.contexts[origWs].env;
    db.get('config', function(err, doc) {
      if (!err) {
        const ws = doc.workspaces;
        let reply = 'Application "' + params.content + '" not found. Staying put.';
        for (let i = 0, len = ws.length; i < len; i++) {
          if (ws[i].name == params.content) {
            params.context.current.workspace_id = ws[i].value;
            if (!_.has(params, 'attributes.silent'))
              reply = 'Switching to application ' + ws[i].name;
            else {
              reply = '';
            }
            break;
          }
        }
        if (_.has(params, 'attributes.poke')) {
          const ws = params.context.current.workspace_id;
          if (typeof params.context.contexts[ws] == 'undefined') { // it's not been initialised.
            params.context.contexts[ws] = {
              env: {},
            };
            if (_.has(params.context, 'current.env'))
              params.context.contexts[ws].env = params.context.current.env;
          }
          const context = params.context.contexts[ws];
          logger.debug('use switched to context: ' + JSON.stringify(context));
          const msgForWatson = {
            context: context,
            workspace_id: ws,
            input: {
              text: ' ',
            },
          };
          watsonConversation.message(msgForWatson, (err, watsonResponse) => {
            if (!err) {
              params.context.contexts[ws] = watsonResponse.context;
              cb(null, watsonResponse.output.text[0]);
            } else {
              cb(new Error('Calling Conversation ' + msgForWatson.workspace_id));
            }
          });
        } else {
          cb(null, reply);
        }
      } else {
        cb(err);
      }
    });
  },
};
