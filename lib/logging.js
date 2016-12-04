const winston = require('winston');
const config = require('config');
const loglevel = process.env.LOG_LEVEL || (config.has('LOG_LEVEL') ? config.get('LOG_LEVEL') : 'info');

const logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)({
      timestamp: true,
      level: loglevel,
      colorize: true,
    }),
    new(winston.transports.File)({
      filename: 'app.log',
      timestamp: true,
      level: loglevel,
    }),
  ],
});

module.exports = logger;
