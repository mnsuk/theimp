'use strict';
const fulfill = require('../lib/fulfill');
const actions = require('../postActions');
const logger = require('../lib/logging');
const _ = require('lodash');

module.exports = {
  controller: function(params, cb) {
    const ws = params.context.current.workspace_id;
    const context = params.context.contexts[ws];

    let tmp = context.app.LastResponse.replace(/XXXX/, params.content);
    logger.debug('repeated command: ' + tmp);
    if (tmp && tmp.length > 1) {
      fulfill(
        actions,
        params.context,
        tmp,
        function(err, finalText) {
          if (err) {
            cb(err);
          }
          cb(null, finalText);
        }
      );
    } else {
      cb(null, params.content);
    }
  },
};
