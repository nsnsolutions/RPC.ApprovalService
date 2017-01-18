'use strict';

const inc = require('require-dir')('.');

(function () {
    var self = {
        'empty': (o) => { return null; },
        'passthru': (o) => { return o; }
    }

    for(var name in inc)
        self[name] = inc[name];

    module.exports = self;
})();
