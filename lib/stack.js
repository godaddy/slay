'use strict';

var Understudy = require('understudy');

/*
 * function Stack(opts)
 * Returns a new middleware Stack with the specified `opts`:
 * @param {name} String Name of this Stack.
 * @param {before} Array (Optional) Set of middlewares to run before main handler.
 * @param {name} Array (Optional) Set of middlewares to run after main handler.
 */
var Stack = module.exports = function Stack(opts) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else if (!opts || typeof opts.name !== 'string') {
    throw new Error('options.name is required.');
  }

  Understudy.call(this);

  var self = this;
  this.name = opts.name;

  //
  // Bind our `before` and `after` implementations since
  // we only have a single interceptor.
  //
  this.before = this._overrideHook('before');
  this.after = this._overrideHook('after');

  //
  // Attach all of our `before` and `after` handlers
  //
  ['before', 'after'].forEach(function (hook) {
    onlyFunctions(opts[hook]).forEach(function (fn) {
      self[hook](fn);
    });
  });

  return this;
};

/*
 * function unshift (hook, fn)
 * Adds the `fn` to the beginning of the hook
 * middleware Array ("before", "after") for this stack.
 */
Stack.prototype.unshift = function (hook, fn) {
  if (hook !== 'before' && hook !== 'after') {
    throw new Error('hook must be "before" or "after"');
  } else if (typeof fn !== 'function') {
    return this;
  }

  //
  // This is the name of the Array(s) that `understudy`
  // uses to track interceptor handler functions.
  //
  var property = '_' + hook + '_interceptors';

  this[property] = this[property] || {};
  var interceptors = this[property].dispatch
    = this[property].dispatch || [];

  interceptors.unshift(fn);
  return this;
};

/*
 * function middleware (handler)
 * Returns a middleware that invokes
 */
Stack.prototype.middleware = function (handler) {
  var self = this;
  return function (req, res, done) {
    self.perform('dispatch', req, res, function (next) {
      handler(req, res, next);
    }, function (err) {
      done(err, req, res);
    });
  };
};

/*
 * function _overrideHook (hook)
 * Overrides the hook with the `specified` name and
 * ensures that anything added will always be a function
 *
 * @api private
 */
Stack.prototype._overrideHook = function (hook) {
  var baseFn = this[hook].bind(this, 'dispatch');
  return function hookOverride(fn) {
    if (typeof fn !== 'function') { return null; }
    return baseFn(fn);
  };
};

/*
 * @private function onlyFunctions (middleware)
 * Ensures that everything in the `middleware` Array
 * is, in fact, a function.
 */
function onlyFunctions(middleware) {
  if (!middleware || !Array.isArray(middleware)) {
    return [];
  }

  return middleware.filter(function (fn) {
    return typeof fn === 'function';
  });
}
