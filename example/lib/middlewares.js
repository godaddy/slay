'use strict';

let rid = 0;

module.exports = function middlwares(app, options, callback) {
  app.perform('middlewares', function performMiddlewares(next) {
    app.use(function httpLogger (req, res, next) {
      app.log.info('%s - request - %s', req.method, req.url, {
        rid: ++rid
      });
    });

    app.after('actions', function postRouting(cb) {
      //
      // Add the 404 handling after we add all of our routes
      //
      app.use(function fourohfour(req, res) {
        app.log.error('Not Found - %s - %s', req.method, req.url);
        res.status(404).end();
      });
      cb();
    });
    next();
  }, callback);
};
