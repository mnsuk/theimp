'use strict';
const fulfill = require('../lib/fulfill');
const actions = require('../postActions');
const logger = require('../lib/logging');
const _ = require('lodash');
const watson = require('watson-developer-cloud');
const extend = require('extend');

// eslint-disable-next-line max-len
const watsonConversation = watson.conversation(extend(global.appEnv.getService('Conversation').credentials, {
  version: 'v1',
  version_date: '2016-09-20',
}));

module.exports = {
  controller: function(params, cb) {
    const ws = params.context.current.workspace_id;
    const context = params.context.contexts[ws];
    const text = params.content;

    const msgForWatson = {
      context: context,
      workspace_id: ws,
      input: {
        text: text,
      },
    };

    watsonConversation.message(msgForWatson, (err, watsonResponse) => {
      if (!err) {
        logger.debug('watsonResponse: ' + JSON.stringify(watsonResponse));
        cb(null, watsonResponse.output.text[0]);
      } else {
        cb(new Error('Calling Conversation ' + msgForWatson.workspace_id));
      }
    });

  },
};
