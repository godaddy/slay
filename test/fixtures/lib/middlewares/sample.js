

/*
 * Defines a sample middleware for your application
 */
module.exports = function (req, res, next) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Your-Custom-Header', 'is-awesome');
  next();
};
