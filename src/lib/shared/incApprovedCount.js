'use strict';

const dispositions = require('../disposition');
const helpers = require('../helpers');

module.exports = function incApprovedCount(seneca, opts) {

    var shared = this,
        env = opts.env,
        approvalTable = opts.tables.approval,
        redis = opts.redisClient,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Increment Approved Count");

        var keys = helpers.makeMetricKeys(env, {
            sponsor: state.person.sponsorId,
            client: state.person.clientId });

        var n = state.get('count', 1);

        redis.multi()

            // Move record from pending
            .hincrby(keys.sponsor, dispositions.PENDING, (n * -1))
            .hincrby(keys.client, dispositions.PENDING, (n * -1))

            // Move count to approved
            .hincrby(keys.sponsor, dispositions.APPROVED, n)
            .hincrby(keys.client, dispositions.APPROVED, n)

            .exec((err, replies) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to record metrics.' });

                done(null, state);
            });
    }

}
