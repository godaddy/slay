'use strict';

var assert  = require('chai').assert,
    util    = require('util'),
    path    = require('path'),
    request = require('request'),
    slay    = require('../');

describe('Slay test suite (unit tests)', function () {

  describe('Initialization of module', function () {
    it('Is defined', function () {
      assert(slay);
      assert(slay.App);
      assert(slay.preboot);
    });

    it('Test all exceptions', function (done) {
      assert.throws(function () {
        slay.App();
      });

      assert.throws(function () {
        slay.App({});
      });

      assert.throws(function () {
        slay.App(__dirname, 'bla bla');
      });

      done();
    });

    describe('Running application tests', function () {
      var App, app;
      var baseUri = 'http://localhost:8080';

      var previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'unique-key';

      /* Boot the app in a before hook */
      before(function (done) {
        App = function (root, options) {
          slay.App.call(this, root, options); // eslint-disable-line no-invalid-this
        };

        util.inherits(App, slay.App);
        assert(App);

        function start(options, callback) {
          if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
          }

          app = new App(path.join(__dirname, 'fixtures'));
          app.start(function (err) {
            if (err) {
              return callback(err);
            }
            callback(null, app);
          });
        }

        start(function (err, instance) {
          assert.ifError(err);
          assert(instance);
          assert.equal(instance.__afterActions, true);
          done();
        });
      });

      it('should set app.env', function (done) {
        assert.equal(app.env, 'unique-key');
        process.env.NODE_ENV = previous;
        done();
      });

      it('Testing the root url of the app', function (done) {
        request(baseUri + '/', function (error, response, body) {
          assert.ifError(error);
          assert(response);
          assert.equal(response.statusCode, 404);
          assert.equal(body, 'not found');
          done();
        });
      });

      /* Shutdown the app */
      after(function (done) {
        app.close(done);
      });
    });

    describe('App.bootstrap', function () {

      it('should not affect other instances when changed', function () {
        var app = new slay.App('testing');
        assert.ok(app);

        //
        // Now we override it and assert the older
        // `app` instance is unchanged.
        //
        var orig = slay.App.bootstrap;
        assert.ok(orig);
        var changed = false;
        slay.App.bootstrap = function modified() {
          assert.equal(slay.App.bootstrap, modified);
          changed = true;
        };

        var copy = new slay.App('testing');
        assert.ok(copy);
        assert.notEqual(slay.App.bootstrap, orig);
        assert.ok(changed);
        slay.App.bootstrap = orig;
      });
    });
  });
});
