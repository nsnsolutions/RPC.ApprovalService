'use strict';

const dispositions = require('../disposition');
const helpers = require('../helpers');

module.exports = function incDeclinedCount(seneca, opts) {

    var shared = this,
        env = opts.env,
        approvalTable = opts.tables.approval,
        redis = opts.redisClient,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Increment Declined Count");

        var keys = helpers.makeMetricKeys(env, {
            sponsor: state.person.sponsorId,
            client: state.person.clientId });

        redis.multi()

            // Move record from pending
            .hincrby(keys.sponsor, dispositions.PENDING, -1)
            .hincrby(keys.client, dispositions.PENDING, -1)

            // Move count to declined
            .hincrby(keys.sponsor, dispositions.DECLINED, 1)
            .hincrby(keys.client, dispositions.DECLINED, 1)

            .exec((err, replies) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to record metrics.' });

                done(null, state);
            });
    }

}
