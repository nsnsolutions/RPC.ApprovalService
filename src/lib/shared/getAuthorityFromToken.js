'use strict';

const AUTHORITY_SERVICE = "role:accountService.Pub,cmd:getAuthorityFromToken.v1";
const rpcUtils = require('rpc-utils');

module.exports = function getAuthorityFromToken(seneca, opts) {

    var shared = this,
        approvalTable = opts.tables.approval,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Get Authority From Token");

        if(!state.has('token'))
            return done({
                name: "badRequest",
                message: "Missing authority." });

        var _header = state.token.split(' ');

        var params = {
            logLevel: state.logLevel || logLevel,
            type: _header[0],
            token: _header[1]
        };

        seneca.act(AUTHORITY_SERVICE, params, (err, result) => {

            if(err)
                return done({
                    name: "notAuthorized",
                    message: "Unable to obtain authority.",
                    innerError: err });

            else if(result.hasError)
                return done({
                    name: "notAuthorized",
                    message: "Authorization failed: " + result.message });

            var person = new rpcUtils.Person(result.result);
            console.debug("Authority: " + person.toString());
            state.set("person", person);
            return done(null, state);
        });
    }
}
