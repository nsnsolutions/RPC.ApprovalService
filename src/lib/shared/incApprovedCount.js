'use strict';

const dispositions = require('../disposition');
const helpers = require('../helpers');

module.exports = function incApprovedCount(seneca, opts) {

    var shared = this,
        approvalTable = opts.tables.approval,
        redis = opts.redisClient,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Increment Approved Count");

        var keys = helpers.makeMetricKeys({
            sponsor: state.person.sponsorId,
            client: state.person.clientId });

        redis.multi()

            // Move record from pending
            .hincrby(keys.sponsor, dispositions.PENDING, -1)
            .hincrby(keys.client, dispositions.PENDING, -1)

            // Move count to approved
            .hincrby(keys.sponsor, dispositions.APPROVED, 1)
            .hincrby(keys.client, dispositions.APPROVED, 1)

            .exec((err, replies) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to record metrics.' });

                done(null, state);
            });
    }

}
