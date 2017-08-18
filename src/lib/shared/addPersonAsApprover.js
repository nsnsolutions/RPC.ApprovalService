'use strict';

const helpers = require('../helpers');

module.exports = function addPersonAsApprover(opts) {

    var seneca = this,
        redis = opts.redisClient,
        models = opts.models,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Adding user as approver.");

        models.Person.forge({
            id: helpers.principal2key($principal),
            userId: $principal.userId,
            sponsorId: state.$principal.sponsorId,
            clientId: state.$principal.clientId,
            fullName: state.$principal.fullName,
            email: state.$principal.email,
            isApprover: true
        }).upsert().then(dbSuccess, error);

        function dbSuccess(model) {
            state.set('approverRecord', model);
            done(null, state);
        }

        function error(err) {
            done({
                name: 'internalError',
                message: "Failed to create approver record.",
                innerError: err.message 
            });
        }
    }
};
