'use strict';

var preboots = {
  'config': 'config',
  'defaults': 'defaults',
  'logger': 'logger',
  'notFound': 'not-found',
  'require': 'require',
  'routers': 'routers'
};

module.exports = Object.keys(preboots)
  .reduce(function (acc, name) {
    acc[name] = require('./' + preboots[name]);
    return acc;
  }, {});
