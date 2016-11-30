'use strict';

const slay = require('slay');
const util = require('util');
const path = require('path');

exports.start = function (opts, callback) {
  if (!callback && typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  const root = opts.root || path.join(__dirname, '..');
  const app = new App(root, opts);
  app.start(function (err) {
    callback(err, app);
  });
};

exports.App = App;

util.inherits(App, slay.App);

function App(root, opts) {
  slay.App.call(this, root, opts);
};

