

var winston = require('winston');

/*
 * Defines a sample preboot for your application
 */
module.exports = function (app, options, callback) {
  //
  // Setup your config to load from (in-order):
  // 1. argv
  // 2. env
  //
  app.config
    .overrides(options)
    .use('argv')
    .use('env')
    .use('literal', { http: 8080 })
    .load(callback);

  app.log.add(new winston.transports.Console());

  var stack = app.stack('default');

  stack.before(function (req, res, next) {
    app.log.info('before middleware 1');
    next();
  });

  stack.before(function (req, res, next) {
    app.log.info('before middleware 2');
    next();
  });

  stack.after(function (req, res, next) {
    app.log.info('after middleware 1');
    next();
  });

  stack.before(function (req, res, next) {
    app.log.info('after middleware 2');
    next();
  });

  var sample = app.stack('sample');
  sample.before(function (req, res, next) {
    app.log.info('before middleware 1');
    next();
  });

  sample.before(function (req, res, next) {
    app.log.info('before middleware 2');
    next();
  });

  sample.after(function (req, res, next) {
    app.log.info('after middleware 1');
    next();
  });

  sample.after(function (req, res, next) {
    app.log.info('after middleware 2');
    next();
  });
};
