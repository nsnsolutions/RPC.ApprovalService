'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const Authorizers = rpcUtils.Principal.Authorizers;

module.exports = function ApprovalCreatePlugin(opts) {

    var seneca = this,
        shared = lib.shared.call(seneca, opts),
        models = opts.models,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:createApprovalRecord.v1', createApprovalRecord_v1);

    return { name: "ApprovalCreatePlugin" };

    // ------------------------------------------------------------------------

    function createApprovalRecord_v1(args, rpcDone) {

        /*
         * Create a new VFS Approval request for an existing job.
         *
         * Args:
         * - commandPacket: A VFS 1.6+ command packet.
         * - fromJobId: An existing VFS Job ID to use as commandPacket.
         *
         * One of the 2 arguments is required. Each is implies it's own
         * validation steps. See below for details on each workflow.
         */

        var params = {
            name: "Create Approval Record (v1)",
            code: "CAR01",
            repr: lib.repr.ApprovalEntity_v1,

            authorizer: Authorizers.with('JOB:10'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            context: { jobId: args.jobId },

            required: [
                { field: 'type', type: String },
                { field: 'jobId', type: String },
                { field: 'title', type: String },
                { field: 'price', type: Number },
            ],

            optional: [
                { field: 'jobUniqueId', type: String, Default: null },
                { field: 'quantity', type: Number, Default: 0 }
            ],

            tasks: [
                shared.addPersonAsAuthor,
                createRecord,
            ],

            postActions: [
                incPendingCountIf,
                raiseEvent
            ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);
    }

    function createRecord(console, state, done) {

        console.log("Creating new approval record.");

        state.set('approvalRecord', new models.Request({
            jobId: state.jobId,
            type: state.type,
            jobUniqueId: state.get('jobUniqueId'),
            title: state.get('title'),
            price: state.get('price'),
            quantity: state.get('quantity'),
            disposition: lib.disposition.PENDING,
            authorId: state.authorRecord.id
        }));

        shared.saveApprovalRecord(console, state, done);
    }

    function incPendingCountIf(console, state, done) {
        if(state.approvalRecord.$method == 'insert') {
            shared.incPendingCount(console, state, done);
        } else {
            console.debug("Detected record update: Skipping pending incr.")
            done(null, state);
        }
    }

    function raiseEvent(console, state, done) {

        var eventType = (state.type == 'email')
          ? 'EmailJobApprovalRequested'
          : 'PrintJobApprovalRequested';

        console.log("Job Type = " + state.type);
        console.log("Event Type = " + eventType);
        console.log("Raising '" + eventType + "' Event");

        var params = {
            token: state.token,
            logLevel: console.level,
            type: eventType,
            jobId: state.approvalRecord.get('jobId'),
            eventDate: rpcUtils.helpers.fmtDate()
        };

        seneca.$Proxy.eventService.raiseEvent(params, (err, data) => {
            if(err) return done(err);
            done(null, state);
        });
    }
};
