'use strict';

const commons = require('require-dir')('.');

module.exports = function Common(trans, opts) {

    var self = {};

    init();

    return self;

    // ------------------------------------------------------------------------

    function init() {
        for(var name in commons)
            self[name] = commons[name].call(self, trans, opts);
    }
};
