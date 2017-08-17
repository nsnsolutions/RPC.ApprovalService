'use strict';

module.exports = function addPersonAsAuthor(opts) {

    var seneca = this,
        redis = opts.redisClient,
        models = opts.models,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        models.Person.forge({
            id: state.$principal.userId,
            sponsorId: state.$principal.sponsorId,
            clientId: state.$principal.clientId,
            fullName: state.$principal.fullName,
            email: state.$principal.email,
        }).upsert().then(success, error);

        function success(model) {
            state.set('authorRecord', model);
            done(null, state);
        }

        function error(err) {
            done({
                name: 'internalError',
                message: "Failed to create author record.",
                innerError: err.message 
            });
        }
    }
}
