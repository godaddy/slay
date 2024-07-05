/* eslint-disable no-process-env */
'use strict';

const assert = require('chai').assert;
const util = require('util');
const path = require('path');
const slay = require('../');
const winston = require('winston');

async function streamToString(stream) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

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
      let App, app;
      const baseUri = 'http://localhost:8080';

      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'unique-key ';

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
          assert.typeOf(app.paths.preboots, 'string');
          assert.typeOf(app.paths.middlewares, 'string');
          assert.typeOf(app.paths.routes, 'string');
          assert.equal(instance.__afterActions, true);
          done();
        });
      });

      it('should set app.env, trimming any whitespace', function (done) {
        assert.equal(app.env, 'unique-key');
        process.env.NODE_ENV = previous;
        done();
      });

      it('Testing the root url of the app', async function () {
        const response = await fetch(baseUri + '/');
        const body = await streamToString(response.body);
        assert.ifError(response.error);
        assert(response);
        assert.equal(response.status, 404);
        assert.equal(body, 'not found');
      });

      /* Shutdown the app */
      after(function (done) {
        app.close(done);
      });
    });

    describe('Preboot logger', function () {
      it('should expose logProvider as winston', function (done) {
        const app = new slay.App(path.join(__dirname, 'fixtures'), {
        });
        app.start(function (error) {
          assert.ifError(error);
          assert.strictEqual(app.logProvider.transports, winston.transports);
          assert.strictEqual(app.logProvider.formats, winston.formats);
          assert.strictEqual(app.logProvider.Container, winston.Container);

          app.close(done);
        });
      });
    });

    describe('Preboot sources', function () {
      it('should accept preboot paths', function (done) {
        const app = new slay.App(path.join(__dirname, 'fixtures'), {
          preboots: path.join(__dirname, 'fixtures/lib/preboots'),
          middlewares: path.join(__dirname, 'fixtures/lib/middlewares'),
          routes: path.join(__dirname, 'fixtures/lib/routes')
        });

        app.start(function (error) {
          assert.ifError(error);
          assert.typeOf(app.paths.preboots, 'string');
          assert.typeOf(app.paths.middlewares, 'string');
          assert.typeOf(app.paths.routes, 'string');
          assert.equal(app.__afterActions, true);

          app.close(done);
        });
      });

      it('should accept preboot callbacks', function (done) {
        const app = new slay.App('testing', {
          preboots: function (prebootApp, options, callback) {
            prebootApp.__callbackPreboots = true;

            app.config
              .use('literal', { http: 8080 })
              .load(callback);
          },
          middlewares: function (prebootApp, options, callback) {
            prebootApp.after('actions', function (prebootDone) {
              prebootApp.__callbackMiddlewares = true;

              prebootDone();
            });

            callback();
          },
          routes: function (prebootApp, options, callback) {
            prebootApp.perform('actions', function (prebootDone) {
              prebootApp.__callbackRoutes = true;

              prebootDone();
            }, callback);
          }
        });

        app.start(function (error) {
          assert.ifError(error);
          assert.isUndefined(app.paths.preboots);
          assert.isUndefined(app.paths.middlewares);
          assert.isUndefined(app.paths.routes);
          assert.equal(app.__callbackPreboots, true);
          assert.equal(app.__callbackMiddlewares, true);
          assert.equal(app.__callbackRoutes, true);

          app.close(done);
        });
      });
    });

    describe('App.bootstrap', function () {

      it('should not affect other instances when changed', function () {
        const app = new slay.App('testing');
        assert.ok(app);

        //
        // Now we override it and assert the older
        // `app` instance is unchanged.
        //
        const orig = slay.App.bootstrap;
        assert.ok(orig);
        let changed = false;
        slay.App.bootstrap = function modified() {
          assert.equal(slay.App.bootstrap, modified);
          changed = true;
        };

        const copy = new slay.App('testing');
        assert.ok(copy);
        assert.notEqual(slay.App.bootstrap, orig);
        assert.ok(changed);
        slay.App.bootstrap = orig;
      });
    });
  });
});
