/* eslint no-process-env: 0 */
'use strict';

var gulp = require('gulp');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('godaddy-test-tools')(gulp, {
  lint: { files: ['*.js', 'lib/**/*.js', 'test/*.js'] },
  istanbulReports: { dir: 'build' },
  unitTestFiles: 'test/*.test.js'
});
