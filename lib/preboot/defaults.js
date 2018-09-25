

var debug = require('diagnostics')('slay:preboot:defaults');

/*
 * Defines a custom route that sets the x-powered-by header for all services
 */
module.exports = function (app, options, callback) {
  debug('executed');

  app.use(function (req, res, next) {
    res.setHeader('x-powered-by', 'Slay');
    next();
  });

  callback();
};
