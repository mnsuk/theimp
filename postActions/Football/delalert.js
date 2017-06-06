'use strict';
const _ = require('lodash');
const logger = require('../../lib/logging');
const Alert = require('../../models/alert');


module.exports = {
  controller: function(params) {
    return new Promise(function(resolve, reject) {
      const ws = params.context.current.workspace_id;
      const context = params.context.contexts[ws];
      const query = params.content;
      Alert.delete(params.context._id, function(err, body) {
        if (err)
          reject(err);
        else {
          resolve('Alert deleted');
        }
      });
    });
  },
};
