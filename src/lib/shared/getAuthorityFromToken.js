'use strict';

const rpcUtils = require('rpc-utils');

module.exports = function getAuthorityFromToken(opts) {

    var seneca = this,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.error("NOT IMPLEMENTED - shared.getAuthorityFromToken");
        done(null, state);

        /*
        console.info("Get Authority From Token");

        if(!state.has('token', String))
            return done({
                name: "badRequest",
                message: "Missing authority." });

        var _header = state.token.split(' ');

        var params = {
            logLevel: state.logLevel || logLevel,
            type: _header[0],
            token: _header[1]
        };

        proxy.accountService.getAuthorityFromToken(params, (err, result) => {

            if(err)
                return done(err);

            var person = new rpcUtils.Person(result);

            console.debug("Authority: " + person.toString());

            state.set("person", person);
            return done(null, state);
        });
        */
    }
}
