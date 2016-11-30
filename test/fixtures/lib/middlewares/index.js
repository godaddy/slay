'use strict';

var middleware = {
  sample: require('./sample')
};

/*
 * Setup the ordering for all of our middlewares in
 * the application.
 */
module.exports = function (app, options, callback) {
  app.log.info('Adding middlewares');
  app.use(middleware.sample);

  app.after('actions', function (done) {
    //
    // Future middlewares for your application go here.
    // Lets add something we can assert in our tests later on.
    //
    app.__afterActions = true;
    done();
  });

  //
  // TODO: How does error handling work from two perspectives
  //   1. Default error handling middleware in Express is garbage
  //   2. We should probably include `errs` somewhere.
  //
  callback();
};
