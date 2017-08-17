'use strict';

const commons = require('require-dir')('.');

module.exports = function Common(opts) {

    var self = Object.create(this) || {};

    init();

    return self;

    // ------------------------------------------------------------------------

    function init() {
        for(var name in commons)
            self[name] = commons[name].call(self, opts);
    }
};
