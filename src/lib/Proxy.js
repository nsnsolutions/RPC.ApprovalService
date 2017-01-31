'use strict';

const rpcUtils = require('rpc-utils');

module.exports = function ProxyConstructor(opts) {

    var self = {},
        seneca = opts.seneca;

    init();

    return self;

    // ------------------------------------------------------------------------

    function init() {

        self.eventService = new rpcUtils.ServiceProxy({
            seneca: seneca,
            service: 'eventService',
            methods: {
                raiseEvent: { version: 'v1' }
            }
        });

        self.jobService = new rpcUtils.ServiceProxy({
            seneca: seneca,
            service: 'jobService',
            methods: {
                processJob: { version: 'v1' }
            }
        });

        self.accountService = new rpcUtils.ServiceProxy({
            seneca: seneca,
            service: 'accountService',
            methods: {
                getAuthorityFromToken: { version: 'v1' }
            }
        });
    }
}
