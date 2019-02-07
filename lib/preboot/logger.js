'use strict';

var merge = require('lodash.merge');
var winston = require('winston');
var debug = require('diagnostics')('slay:preboot:logger');

/*
 * Defines the logger "middleware", that sets up
 * a winston Logger for this app instance.
 */
module.exports = function (app, options, callback) {
  if (app.log) {
    debug('executed, app.log exists, skipping hookable "logger"');
    return callback();
  }

  debug('executed, perform hookable "logger"');

  app.hookable('logger', function (ext, done) {
    app.log = winston.createLogger(merge({}, options.log, ext));

    //
    // Since we do not add a transport by default if the user
    // has not configured `app.log` with any transports by when
    // the HTTP(S) servers have started we will warn them.
    //
    // Here AND ONLY HERE is it ok to use `console.error`.
    //
    app.after('start', function verify(i, s, verified) {
      if (!Object.keys(app.log.transports).length) {
        console.error('Warning: winston is not configured with any transports.'); // eslint-disable-line no-console
        console.error('You can add transports with `app.log.add`');  // eslint-disable-line no-console
      }

      verified();
    });

    done();
  }, callback);
};
