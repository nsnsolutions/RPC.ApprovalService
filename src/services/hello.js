'use strict';

module.exports = function HelloPlugin(opts) {

    var seneca = this,
        fixed = opts.fixed;

    fixed.assertMember("defaultName", String);

    seneca.rpcAdd('role:hello.Pub,cmd:greet.v1', greet_v1);

    return { name: "HelloPlugin" };

    // ------------------------------------------------------------------------

    function greet_v1(args, req) {

        args.ensureExists("name", fixed.defaultName);

        req.success({
            message: `Hello, ${args.name}!`,
            details: [
                "Welcome to rpcfw!",
                "This is a framework to help you build microservices.",
                `To get started, open ${__filename} and change this code.`,
                "Also take a look at the documentation.",
                "https://github.com/nsnsolutions/rpcfw"
            ]
        });

    }
};
