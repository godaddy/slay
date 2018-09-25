

var debug = require('diagnostics')('slay:preboot:require');

/*
 * Lazily require a file or directory as a
 * preboot "middleware".
 */
module.exports = function (opts) {
  var fullpath = typeof opts !== 'string' ? opts.fullpath : opts;

  debug('schedule %s', fullpath);

  return function (app, options, callback) {
    var bootable;

    try {
      debug('executed %s', fullpath);
      bootable = require(fullpath);
    } catch (ex) { // probably we want to throw an error here and halt the application?
      debug('warning Could not load preboot for %s', fullpath, ex.stack);
      return callback();
    }
    bootable(app, options, callback);
  };
};
