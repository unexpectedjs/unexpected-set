/* global expect:true */
expect = require('unexpected').clone();
expect.output.preferredWidth = 80;
expect.use(require('./lib/unexpected-set'));
