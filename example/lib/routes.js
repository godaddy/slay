'use strict';

module.exports = function routes(app, options, callback) {
  //
  // This now becomes a hookable event. you can add `app.before('actions', ...`
  // and `app.after('actions', ...`
  //
  app.perform('actions', function performRoutes(next) {

    // Simple hello-world
    app.routes.get('/', function (req, res) {
      res.end('Hello World');
    });

    next();
  }, callback);
};
