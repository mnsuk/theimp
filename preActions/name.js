'use strict';
const logger = require('../lib/logging');
const utils = require('../lib/utils');
const request = require('request');


module.exports = {
  controller: function(params, cb) {
    request.post(
      'http://uimaae.eu-gb.mybluemix.net/AE/Person?mode=json', {
        form: {
          text: params.content,
          mode: 'json',
        },
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          const p = JSON.parse(body);
          if (p.Name)
            if (p.Name.coveredText) {
              params.context.req = {
                Name: p.Name.coveredText,
              };
            }
        } else {
          logger.warn('Name preAction ' + error);
        }
        cb(null, '');
      }
    );
  },
};
