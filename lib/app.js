'use strict';

var util     = require('util'),
    path     = require('path'),
    express  = require('express'),
    Broadway = require('broadway'),
    builtins = require('./preboot'),
    Stack    = require('./stack');

var debug = require('diagnostics')('slay:app');

/**
 * Constructor function for the Slay app object.
 * @param {string} root Root directory of the application
 * @param {object} options Options for this app instance.
 * @constructor
 */
function App(root, options) {
  options = options || {};
  if (!root || typeof root !== 'string') {
    throw new Error('Application root is not provided or not a string.');
  }
  if (typeof options !== 'object') {
    throw new Error('Application options is not provided or not an object.');
  }

  Broadway.call(this, options, express());
  App.bootstrap(this, root);
}

util.inherits(App, Broadway);

/*
 * function hookable (name, fn)
 * Creates a "hookable" named action that
 * other plugins and parts of the app can
 * run before or after as well as add additional
 * options into.
 */
App.prototype.hookable = function (name, fn, callback) {
  var ext = {};
  this.perform(name, this, ext, function (done) {
    fn(ext, done);
  }, callback);
};

/**
 * Registers a new Stack for the specified `opts` with this
 * instance. Returns the middleware function for executing the
 * stack with the `handler` and optional `callback`.
 * @param {Object} opts Options for this stack.
 * @param {function} handler Middleware handler for this stack.
 * @returns {function|Object} Middleware handler or the stack created.
 * @api public
 */
App.prototype.stack = function (opts, handler) {
  var stack = new Stack(opts);

  //
  // Initialize the middleware stack on the
  // `app` instance.
  //
  this.stacks = this.stacks || {};
  this.stacks[stack.name] = stack;

  return handler
    ? stack.middleware(handler)
    : stack;
};

/**
 * Configures the specified `app` with the standard
 * "setup" and "start" interceptor flow(s).
 * @param {App} app Slay application to bootstrap
 * @param {string} root Root directory of the application
 * @returns {undefined} No return value.
 */
App.bootstrap = function (app, root) {

  app.rootDir = root = root || app.rootDir;

  app.paths = ['preboots', 'middlewares', 'routes'].reduce(function (acc, name) {
    var given = app.given[name];

    if (typeof given !== 'function') {
      acc[name] = given || path.join(root, 'lib', name);
    }

    return acc;
  }, {});

  debug('bootstrap.root', app.rootDir);
  debug('bootstrap.paths', app.paths);

  app.before('setup', builtins.config);
  app.before('setup', builtins.logger);
  app.preboot(builtins.defaults);
  app.preboot(builtins.routers);

  app.after('config', function (instance, options, done) {
    app.env = (app.env || app.config.get('env') || process.env.NODE_ENV).trim();
    done();
  });

  app.before('setup', function (instance, options, done) {
    var resolve = function (name) {
      return typeof app.given[name] === 'function'
        ? app.given[name]
        : builtins.require(app.paths[name]);
    };

    resolve('preboots')(app, options, function (err) {
      if (err) {
        return done(err);
      }

      // Call the preboots for `./lib/middlewares` and `./lib/routes`
      app.preboot(resolve('middlewares'));
      app.preboot(resolve('routes'));
      app.preboot(builtins.notFound);
      done.apply(null, arguments);
    });
  });
};

module.exports = App;
