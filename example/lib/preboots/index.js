'use strict';

const winston = require('winston');

module.exports = function preboots(app, options, callback) {
  app.log.add(winston.transports.Console);
  app.preboot(require('./config'));
  app.preboot(require('./db'));

  callback();
};
