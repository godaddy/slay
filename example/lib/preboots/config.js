'use strict';

module.exports = function preboots(app, options, callback) {
  app.config.use('argv')
            .use('env')

  callback();
};
