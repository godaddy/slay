'use strict';

var Stack = require('../').Stack;
var sinon = require('sinon');
var assert = require('chai').assert;

describe('Stack tests', function () {
  it('Throws when creating an invalid stack', function (done) {
    assert.throws(Stack, Error, 'options.name is required.');
    done();
  });

  it('Does not throw with a proper declaration (name)', function () {
    var stack = new Stack('myMiddleware');
    assert(stack);
  });

  it('Does not throw with a proper declaration ({ name, before })', function () {
    var stack = new Stack({
      name: 'myMiddleware',
      before: []
    });

    assert(stack);
  });

  it('Does not throw with a proper declaration ({ name, before, after })', function () {
    var stack = new Stack({
      name: 'myMiddleware',
      before: [],
      after: []
    });

    var handlers = {
      after: function afterFn(req, res, next) { next(); },
      before: function beforeFn(req, res, next) { next(); }
    };

    assert(stack);

    assert.equal(stack, stack.after(handlers.after));
    assert.equal(1, stack._after_interceptors.dispatch.length);
    assert.equal(handlers.after, stack._after_interceptors.dispatch[0]);

    assert.equal(stack, stack.before(handlers.before));
    assert.equal(1, stack._before_interceptors.dispatch.length);
    assert.equal(handlers.before, stack._before_interceptors.dispatch[0]);
  });

  it('Filters non-functions when created with before and after containting non-functions', function () {
    var handlers = {
      after: function afterFn(req, res, next) { next(); },
      before: function beforeFn(req, res, next) { next(); }
    };

    var stack = new Stack({
      name: 'myMiddleware',
      before: [handlers.before, 2, {}, false],
      after: [1, true, 'middleware', handlers.after]
    });

    assert(stack);
    assert.equal(1, stack._after_interceptors.dispatch.length);
    assert.equal(handlers.after, stack._after_interceptors.dispatch[0]);

    assert.equal(1, stack._before_interceptors.dispatch.length);
    assert.equal(handlers.before, stack._before_interceptors.dispatch[0]);
  });

  describe('.before(fn)', testStackHook('before'));
  describe('.after(fn)', testStackHook('after'));

  describe('.unshift(hook, fn)', function () {
    it('Adds only-functions to the front of the hook interceptors', function () {
      var handlers = {
        after: function afterFn(req, res, next) { next(); },
        before: function beforeFn(req, res, next) { next(); }
      };

      var unshift = {
        after: function afterFn(req, res, next) { next(); },
        before: function beforeFn(req, res, next) { next(); }
      };

      var stack = new Stack({
        name: 'myMiddleware',
        before: [handlers.before, 2, {}, false],
        after: [1, true, 'middleware', handlers.after]
      });

      assert(stack);
      assert.equal(1, stack._after_interceptors.dispatch.length);
      assert.equal(handlers.after, stack._after_interceptors.dispatch[0]);

      assert.equal(1, stack._before_interceptors.dispatch.length);
      assert.equal(handlers.before, stack._before_interceptors.dispatch[0]);

      assert.throws(function () {
        stack.unshift('not before or after', Error);
      });

      ['before', 'after'].forEach(function (hook) {
        var property = '_' + hook + '_interceptors';

        assert.equal(stack, stack.unshift(hook, unshift[hook]));
        assert.equal(stack, stack.unshift(hook, false));
        assert.equal(stack, stack.unshift(hook, 'unshift hook'));
        assert.equal(2, stack[property].dispatch.length);
        assert.equal(unshift[hook], stack[property].dispatch[0]);
      })
    });
  });

  describe('.middleware(handler)', function () {
    it('should invoke the before and after interceptors', function () {
      var handlers = {
        before: sinon.stub().callsArg(2),
        after: sinon.stub().callsArg(2)
      };

      var stack = new Stack({
        name: 'myMiddleware',
        before: [handlers.before],
        after: [handlers.after]
      });

      var middleware = stack.middleware(function (req, res, next) {
        sinon.assert.calledOnce(handlers.before);
        next();
      });

      middleware(null, null, function (err) {
        assert(!err);
        sinon.assert.calledOnce(handlers.after);
      });
    });

    it('should invoke the error handler correctly', function () {
      var context = {
        error: new Error('Contextual error message'),
        req: { req: true },
        res: { res: true }
      };

      var handlers = {
        before: sinon.stub().callsArg(2),
        after: sinon.stub().callsArgWith(2, context.error)
      };

      var stack = new Stack({
        name: 'myMiddleware',
        before: [handlers.before],
        after: [handlers.after]
      });

      var middleware = stack.middleware(function (req, res, next) {
        sinon.assert.calledOnce(handlers.before);
        next();
      });

      middleware(context.req, context.res, function (err, req, res) {
        assert.equal(err, context.error);
        assert.equal(req, context.req);
        assert.equal(res, context.res);
        sinon.assert.calledOnce(handlers.after);
      });
    });
  });
});

/*
 * function testStackHook(hook)
 * Returns a test suite for the specified hook name (before, after).
 *
 * @api private
 */
function testStackHook(hook) {
  return function () {
    it('Adds only functions silently filters non-functions', function () {
      function handler(req, res, next) { next(); }

      var stack = new Stack('myMiddleware.' + hook);
      var property = '_' + hook + '_interceptors';

      assert(stack);
      stack[hook](handler);
      stack[hook](false);
      stack[hook](hook + ' middlware');
      assert.equal(1, stack[property].dispatch.length);
      assert.equal(handler, stack[property].dispatch[0]);
    });
  }
}
