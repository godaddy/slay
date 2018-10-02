'use strict';

var routes = {
  sample: require('./sample')
};

/*
 * Setup the ordering for all of our routing in
 * the application.
 */
module.exports = function (app, options, callback) {
  app.perform('actions', function (done) {
    app.log.info('Adding routes');
    routes.sample(app, options);

    //
    // Future routes for your application go here.
    //
    done();
  }, callback);
};
