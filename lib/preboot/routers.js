'use strict';

var express = require('express');
var merge = require('lodash').merge;

/*
 * Defines the logger "middleware", that sets up
 * a winston Logger for this app instance.
 */
module.exports = function (app, options, callback) {
  app.hookable('routers', function (ext, done) {
    app.routes = express.Router(merge({}, app.options.router, ext));

    //
    // Remark: This suggests we should probably bring
    // the "actions" semantic into the slay layer.
    //
    app.before('actions', function (next) {
      app.use(app.routes);
      next();
    });

    done();
  }, callback);
};


