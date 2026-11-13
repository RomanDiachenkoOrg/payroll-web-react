'use strict';
// Deletes mock-server/data so the next start begins again from the seed files.
var fs = require('fs');
var path = require('path');

var dir = path.join(__dirname, 'data');
fs.rmSync(dir, { recursive: true, force: true });
console.log('Removed ' + dir);
