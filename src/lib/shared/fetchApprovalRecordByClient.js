'use strict';

module.exports = function fetchApprovalRecordByClient(opts) {

    var seneca = this,
        redis = opts.redisClient,
        models = opts.models,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        models.Request
            .where({ jobId: state.jobId })
            .fetch({ withRelated: [ 'author', 'approver' ] })
            .then(success, error);

        function success(model) {

            if(!model)
                return done({
                    name: 'notFound',
                    message: 'JobId not found: ' + state.jobId 
                });

            else if(model.relations.author.get('clientId') != state.$principal.clientId)
                return done({
                    name: 'notFound',
                    message: 'JobId not found: ' + state.jobId 
                });

            state.set('approvalRecord', model);
            return done(null, state);
        }

        function error(err) {
            done({
                name: 'internalError',
                message: "Failed to load approval request.",
                innerError: err.message 
            });
        }
    }
}
