'use strict';
/**
 * Include all JavaScript files in this folder on the module exports object.
 */

// NPM Dependencies
const fs = require('fs');
const path = require('path');


fs.readdirSync(__dirname).forEach(function(file) {
  if (file.endsWith('.js') && file !== 'index.js')
    exports[file.substr(0, file.length - 3)] = require('./' + file);
  const normalisedPath = path.join(__dirname, file);
  if (fs.lstatSync(normalisedPath).isDirectory()) {
    fs.readdirSync(normalisedPath).forEach(function(file2) {
      if (file2.endsWith('.js') && file2 !== 'index.js')
        exports[file2.substr(0, file2.length - 3)] = require('./' + file + '/' + file2);
    });
  }
});
