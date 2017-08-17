'use strict';

module.exports = function saveApprovalRecord(opts) {

    var seneca = this,
        models = opts.models,
        bookshelf = opts.bookshelf,
        logLevel = opts.logLevel;

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Save Approval Record");

        state.approvalRecord.upsert().then(success, error);

        function success(model) {

            var params = {
                withRelated: [ 'author', 'approver' ]
            };

            // Re-fetch to load in relations and get the timestamps.
            state.approvalRecord.refresh(params).then((m) => {
                state.set('approvalRecord', model);
                done(null, state);
            }, error);
        }

        function error(err) {
            done({
                name: 'internalError',
                message: "Failed to create request.",
                innerError: {
                    "code": err.code,
                    "message": err.message
                }
            });
        }
    }
}
