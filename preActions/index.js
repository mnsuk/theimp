#! /usr/bin/env node

'use strict';

/**
 * Include all JavaScript files in this folder on the module exports object.
 */

// NPM Dependencies
var fs = require("fs");


fs.readdirSync(__dirname).forEach(function(file) {
  if (file.endsWith(".js") && file !== "index.js")
    exports[file.substr(0, file.length - 3)] = require("./" + file);
});
