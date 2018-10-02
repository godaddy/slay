/* eslint-disable no-process-env */
'use strict';

const util = require('util');
const path = require('path');
const express = require('express');
const Broadway = require('broadway');
const builtIns = require('./preboot');
const Stack = require('./stack');

const debug = require('diagnostics')('slay:app');

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
  const ext = {};
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
  const stack = new Stack(opts);

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
    const given = app.given[name];

    if (typeof given !== 'function') {
      acc[name] = given || path.join(root, 'lib', name);
    }

    return acc;
  }, {});

  debug('bootstrap.root', app.rootDir);
  debug('bootstrap.paths', app.paths);

  app.before('setup', builtIns.config);
  app.before('setup', builtIns.logger);
  app.preboot(builtIns.defaults);
  app.preboot(builtIns.routers);

  app.after('config', function (instance, options, done) {
    app.env = (app.env || app.config.get('env') || process.env.NODE_ENV).trim();
    done();
  });

  app.before('setup', function (instance, options, done) {
    function resolve(name) {
      return typeof app.given[name] === 'function'
        ? app.given[name]
        : builtIns.require(app.paths[name]);
    }

    resolve('preboots')(app, options, function (err) {
      if (err) {
        return done(err);
      }

      // Call the preboots for `./lib/middlewares` and `./lib/routes`
      app.preboot(resolve('middlewares'));
      app.preboot(resolve('routes'));
      app.preboot(builtIns.notFound);
      done.apply(null, arguments);
    });
  });
};

module.exports = App;
