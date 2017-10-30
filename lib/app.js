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

  app.paths = {
    preboots: app.given.preboots || path.join(root, 'lib', 'preboots'),
    middlewares: app.given.middlewares || path.join(root, 'lib', 'middlewares'),
    routes: app.given.routes || path.join(root, 'lib', 'routes')
  };

  debug('bootstrap.root', app.rootDir);
  debug('bootstrap.paths', app.paths);

  app.before('setup', builtins.config);
  app.before('setup', builtins.logger);
  app.preboot(builtins.defaults);
  app.preboot(builtins.routers);

  app.after('config', function (instance, options, done) {
    // eslint-disable-next-line no-process-env
    app.env = (app.env || app.config.get('env') || process.env.NODE_ENV).trim();
    done();
  });

  app.before('setup', function (instance, options, done) {
    builtins.require(app.paths.preboots)(app, options, function (err) {
      if (err) {
        return done(err);
      }

      // Call the preboots for `./lib/middlewares` and `./lib/routes`
      app.preboot(builtins.require(app.paths.middlewares));
      app.preboot(builtins.require(app.paths.routes));
      app.preboot(builtins.notFound);
      done.apply(null, arguments);
    });
  });
};

/**
 * Performs a graceful shutdown of `app` with the standard
 * "close" and "free" interceptor flow(s).
 * @param {App} app Slay application to bootstrap
 * @param {function} cb Root directory of the application
 * @returns {undefined} No return value.
 */
App.prototype.dispose = function dispose(cb) {
  var app = this;
  var shutdown = app.config.get('dispose');
  function forceKill() {
    debug('dispose timeout');
    cb(new Error('dispose timeout'));
  }
  if (shutdown) {
    var freeAfter = typeof dispose.freeAfter === 'number' ?
      dispose.freeAfter :
      30;
    // TCP default timeout is 180s
    var killAfter = typeof dispose.killAfter === 'number' ?
      dispose.killAfter :
      180;
    debug('shutdown starting, free after %d s and force kill after %d s',
      freeAfter,
      killAfter);
    setTimeout(forceKill, killAfter * 1000).unref();
    app.perform('close', function close(next) {
      app.close(function onclosed(err) {
        if (err) {
          debug('close error %s', err.message);
          return void cb(err);
        }
        return void next();
      });
    }, function closed() {
      setTimeout(freeResources, freeAfter * 1000);
      function freeResources() {
        app.perform('free', function (err) {
          if (err) {
            debug('free error %s', err.message);
            return void cb(err);
          }
          var handles = process._getActiveHandles();
          if (handles && handles.length) {
            debug('free warning %s active handles still open',
              handles.length);
          }
          return void cb(null);
        });
      }
    });
  }
};

module.exports = App;
