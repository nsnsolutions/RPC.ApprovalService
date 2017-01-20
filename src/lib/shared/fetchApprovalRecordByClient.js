'use strict';

module.exports = function fetchApprovalRecordByClient(seneca, opts) {

    var shared = this,
        approvalTable = opts.tables.approval,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Fetch Approval Record For Client");

        var params = {
            logLevel: console.level,
            index: 'clientId-jobId-index',
            key: {
                clientId: state.person.clientId,
                jobId: state.jobId
            }
        };

        approvalTable.fetch(params, (err, record) => {
            if(err)
                return done({
                    name: 'internalError',
                    message: 'Failed to fetch approval record.',
                    innerError: err });

            else if(!record)
                return done({
                    name: 'notFound',
                    message: 'JobId not found: ' + state.jobId });

            state.set('approvalRecord', record);
            done(null, state);
        });
    }
}
