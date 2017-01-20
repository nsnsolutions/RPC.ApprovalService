'use strict';

const helpers = require('../helpers');

module.exports = function addPersonAsApprover(seneca, opts) {

    var shared = this,
        env = opts.env,
        approvalTable = opts.tables.approval,
        redis = opts.redisClient,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Adding user to list of approvers.");

        var keys = helpers.makeApproverKeys(env, {
            sponsor: state.person.sponsorId,
            client: state.person.clientId });

        var value = JSON.stringify(state.person);

        console.debug("Adding approver under HKEY: " + keys.sponsor);
        console.debug("Adding approver under HKEY: " + keys.client);

        redis.multi()
            .hset(keys.sponsor, state.person.userId, value)
            .hset(keys.client, state.person.userId, value)
            .exec((err, result) => {
                if(err)
                    return done({
                        name: "internalError",
                        message: "Failed to add user to list of approvers." });

                done(null, state)
            });
    }
};
