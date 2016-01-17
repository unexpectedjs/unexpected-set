/*global unexpected:true*/
unexpected = require('unexpected');
unexpected.use(require('./lib/unexpected-set'));
unexpected.output.preferredWidth = 80;

require('es6-set/implement');
