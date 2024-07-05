'use strict';

module.exports = function db(app, options, callback) {
  app.db = new DB(app.config.get('db') || options.db);

  app.db.connect(callback);
};

//
// Pretend database stub to show that preboots are especially useful for
// async initialization
//
function DB(options) {}

DB.prototype.connect = function connect(callback) {
  setImmediate(callback);
};
