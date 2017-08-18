'use strict';

const dispositions = require('../disposition');
const helpers = require('../helpers');

module.exports = function incPendingCount(opts) {

    var seneca = this,
        redis = opts.redisClient,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Increment Pending Count");

        var keys = {
            sponsor: helpers.makeMetricKeys({ sponsorId: state.$principal.sponsorId }),
            client: helpers.makeMetricKeys({ clientId: state.$principal.clientId })
        };

        redis.multi()
            .hincrby(keys.sponsor, dispositions.PENDING, 1)
            .hincrby(keys.client, dispositions.PENDING, 1)
            .exec((err, replies) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to record metrics.' 
                    });

                else
                    return done(null, state);
            });
    }

}
