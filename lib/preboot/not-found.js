'use strict';

/*
 * Defines a route not found when no services are found
 */
module.exports = function (app, options, callback) {
  app.all('*', function (req, res) {
    app.perform('notFound', null, function () {
      res.statusCode = 404;
      res.end('not found');
    });
  });
  callback();
};
