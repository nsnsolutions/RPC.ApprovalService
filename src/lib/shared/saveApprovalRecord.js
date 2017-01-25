'use strict';

module.exports = function saveApprovalRecord(seneca, opts) {

    var shared = this,
        approvalTable = opts.tables.approval,
        logLevel = opts.logLevel

    return handler;

    // -----------------------------------------------------------------------

    function handler(console, state, done) {

        console.info("Save Approval Record");

        var params = {
            item: state.approvalRecord,
            logLevel: console.logLevel
        };

        approvalTable.save(params, (err) => {
            if(err) 
                return done({
                    name: "internalError",
                    message: "Failed to save approval record.",
                    innerError: err });

            done(null, state);
        });
    }
}
