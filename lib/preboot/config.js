'use strict';

var merge = require('lodash.merge');
var nconf = require('nconf');
var debug = require('diagnostics')('slay:preboot:config');

/*
 * Defines the config "middleware", that sets up
 * an nconf Provider for this app instance which can
 * load config from:
 *   - Environment variables
 *   - CLI arguments
 *   - Files
 */
module.exports = function (app, options, callback) {
  debug('executed, perform hookable "config"');

  app.hookable('config', function (ext, done) {
    app.config = new nconf.Provider(merge({}, options.config, ext));
    app.config.load(done);
  }, callback);
};
