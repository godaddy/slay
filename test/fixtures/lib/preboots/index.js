'use strict';

var preboot = {
  sample: require('./sample')
};

/*
 * Setup the ordering for all of our prebooting in
 * the application.
 */
module.exports = function (app, options, callback) {
  app.preboot(preboot.sample);

  //
  // Future preboots for your application go here.
  //

  callback();
};
