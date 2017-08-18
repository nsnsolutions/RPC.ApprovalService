'use strict';

const dispositions = require('../disposition');
const helpers = require('../helpers');

module.exports = function incApprovedCount(opts) {

    var seneca = this,
        redis = opts.redisClient,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Increment Approved Count");

        var keys = {
            sponsor: helpers.makeMetricKeys({ sponsorId: state.$principal.sponsorId }),
            client: helpers.makeMetricKeys({ clientId: state.$principal.clientId })
        };

        var n = state.get('count', 1);

        redis.multi()

            // Remove count from pending
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
