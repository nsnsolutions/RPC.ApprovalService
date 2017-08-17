'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const Authorizers = rpcUtils.Principal.Authorizers;


module.exports = function ApprovalFetchPlugin(opts) {

    var seneca = this,
        shared = lib.shared.call(seneca, opts),
        models = opts.models,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchApprovalRecord.v1', fetchApprovalRecord_v1);

    return { name: 'ApprovalFetchPlugin' };

    // ------------------------------------------------------------------------

    function fetchApprovalRecord_v1 (args, rpcDone) {

        /*
         * Fetch an exsiting approval request.
         *
         * Args:
         * - jobId: The jobId associated with the approval request.
         *
         */

        var params = {
            name: "Fetch Approval Record (v1)",
            code: "EAR01",
            repr: lib.repr.ApprovalEntity_v1,

            authorizer: Authorizers.isAuthenticated(),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            context: { jobId: args.jobId },

            required: [
                { field: 'jobId', type: String },
            ],

            optional: [ /* No Args */ ],

            tasks: [
                shared.fetchApprovalRecordByClient
            ],

            postActions: [ /* No Actions */ ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);
    }
};
