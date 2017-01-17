'use strict';
if (!process.env.NODE_ENV) {
  console.log('NODE_ENV not set.'); // eslint-disable-line
  process.exit();
}
const express = require('express');
const app = express();
require('./config/express')(app);
const logger = require('./lib/logging');

app.listen(global.appEnv.port, '0.0.0.0', function() {
  logger.info('Server starting on ' + global.appEnv.url + ' in ' +
    app.get('env') + ' mode.');
});
