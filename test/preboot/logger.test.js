'use strict';

const assert = require('chai').assert;
const winston = require('winston');
const logger = require('../../lib/preboot/logger');

describe('Logger test suite (unit tests)', function () {

  describe('Initialization of module', function () {
    it('Is defined', function () {
      assert(logger);
      assert.typeOf(logger, 'function');
    });
  });

  describe('Preboot', function () {
    it('should call hookable', function (done) {
      const prebootCallback = () => { };
      const app = {
        hookable: (event, fn, callback) => {
          assert.equal(event, 'logger');
          assert.equal(callback, prebootCallback);
          done();
        }
      };
      logger(app, null, prebootCallback);
    });

    it('should produce logger', function (done) {
      const app = {
        hookable: (event, fn, callback) => {
          fn(null, () => {
            callback();
          });
        },
        after: (event, callback) => {
          assert.equal(event, 'start');
          assert.typeOf(callback, 'function');
        }
      };
      const options = {
        log: {
          transports: [new winston.transports.Console()]
        }
      };
      logger(app, options, () => {
        assert(app.log);
        assert.typeOf(app.log.error, 'function');
        assert.typeOf(app.log.warn, 'function');
        assert.typeOf(app.log.info, 'function');
        done();
      });
    });

    it('should not produce logger when app.log exists', function (done) {
      const log = { };
      const app = {
        log
      };
      logger(app, null, () => {
        assert.equal(app.log, log);
        done();
      });
    });
  });
});
