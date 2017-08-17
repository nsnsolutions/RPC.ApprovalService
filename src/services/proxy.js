'use strict';

const rpcUtils = require('rpc-utils');

module.exports = function ProxyPlugin(opts) {

    var seneca = this,
        logLevel = opts.logLevel;

    seneca.decorate('$Proxy', {

        eventService: new rpcUtils.ServiceProxy({
            seneca: seneca,
            logLevel: logLevel,
            service: 'eventService',
            methods: [ { name: 'raiseEvent', version: 'v1' } ]
        }),

        jobService: new rpcUtils.ServiceProxy({
            seneca: seneca,
            logLevel: logLevel,
            service: 'jobService',
            methods: [ { name: "processJob", version: 'v1' } ]
        }),

        accountService: new rpcUtils.ServiceProxy({
            seneca: seneca,
            logLevel: logLevel,
            service: 'accountService',
            methods: [ { name: "getAuthorityFromToken", version: 'v1' } ]
        })

    });

    return { name: "ProxyPlugin" };

}
