var express= require('express');
var app = express();
var winston = require('winston');

// Bootstrap application (sets global appEnv)
require('./config/express')(app);

  app.listen(appEnv.port, '0.0.0.0', function() {
    winston.log('info', "server starting on " + appEnv.url + " in " + app.get('env'));
});
