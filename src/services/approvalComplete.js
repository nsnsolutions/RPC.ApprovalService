'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const Authorizers = rpcUtils.Principal.Authorizers;
const async = require('async');

module.exports = function ApprovalCompletePlugin(opts) {

    var seneca = this,
        shared = lib.shared.call(seneca, opts),
        models = opts.models,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:finalizeApprovalRequest.v1', finalizeApprovalRequest_v1);

    return { name: "ApprovalListPlugin" };

    // ------------------------------------------------------------------------

    function finalizeApprovalRequest_v1(args, rpcDone) {

        /*
         * Finalize an approval request.
         *
         * Args:
         * - jobIds: An array of jobs to finzlize.
         * - disposition: once of: approved, declined
         * - comments: string comments to associate with the dispossition
         *   (optional)
         */

        var params = {

            name: "Finalize Approval Request (v1)",
            code: "FAR01",
            repr: lib.repr.FinalizeResponseEntity_v1,

            authorizer: Authorizers.with('JOB:30'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            required: [
                { field: 'jobIds', type: Array },
                { field: 'disposition', type: String,
                  customValidator: (o)=>lib.disposition.hasOwnProperty(o.toLowerCase()) }
            ],

            optional: [
                { field: 'comments', type: String }
            ],

            tasks: [
                fetchApprovalRecords,
                shared.addPersonAsApprover,
                updateApprovalRecords,
                updateApprovalMetrics,
            ],

            postActions: [
                finalizeJob
            ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);

    }

    function fetchApprovalRecords(console, state, done) {

        console.info("Fetching approval records.");

        async.map(state.jobIds,

            (jobId, next) => {

                var _state = new rpcUtils.VerifiableObject({
                    "$principal": state.$principal,
                    jobId: jobId
                });

                shared.fetchApprovalRecordByClient(console, _state, (err, result) => {
                    if(err)
                        return next(err);
                    next(null, result.approvalRecord);
                });
            },

            (err, results) => {
                if(err)
                    return done(err);

                state.set('approvalRecords', results);
                done(null, state);
            }

        );
    }

    function updateApprovalRecords(console, state, done) {

        console.info("Updating Approval records.");

        var completedApprovalRecords = [];

        async.map(state.approvalRecords,

            (record, next) => {

                if(record.get('disposition') !== lib.disposition.PENDING)
                    return next(null, {
                        jobId: record.get('jobId'),
                        success: false,
                        message: "Record already finalized." });

                record.set('comments', state.comments);
                record.set('disposition', lib.disposition[state.disposition.toLowerCase()]);
                record.set('approverId', state.approverRecord.id)
                record.set('completed_at', rpcUtils.helpers.fmtDate());

                // What a mess
                record.save().then(model=> {
                    model.refresh({withRelated:['author','approver']}).then(m=> {
                        completedApprovalRecords.push(m);
                        next(null, {
                            jobId: record.get('jobId'),
                            success: true,
                            message: "Completed successfully" 
                        });
                    }, (err) => {
                        completedApprovalRecords.push(record);
                        next(null, {
                            jobId: record.get('jobId'),
                            success: true,
                            message: "Completed successfully"
                        });
                    });
                }, (err) => {
                    return next(null, {
                        jobId: record.get('jobId'),
                        success: false,
                        message: err.message
                    });
                });
            },

            (err, results) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to finalize approval requests.',
                        innerError: err 
                    });

                state.set('results', results);
                state.set('approvalRecords', completedApprovalRecords);
                state.set('hasError', state.jobIds.length > state.approvalRecords.length)

                done(null, state);
            }
        );
    }

    function updateApprovalMetrics(console, state, done) {

        console.info("Updating Metrics.");

        var inc= state.disposition === lib.disposition.APPROVED
            ? 'incApprovedCount'
            : 'incDeclinedCount';

        var _state = rpcUtils.VerifiableObject({
            $principal: state.$principal,
            count: state.approvalRecords.length
        });

        if(_state.count <= 0)
            return done(null, state);

        shared[inc](console, _state, (err, result) => done(err, state));
    }

    function finalizeJob(console, state, done) {

        console.info("Finalizing Job.");

        async.map(state.approvalRecords,

            (record, next) => {

                var params = {
                    logLevel: console.level,
                    jobId: record.get('jobId'),
                    token: state.token
                };

                console.log('Job Type = ' + record.get('type'));

                seneca.$Proxy.jobService.processJob(params, (err, result) => {
                    if(err)
                        console.warn("Failed to finalize job.\n", err);

                    else if(record.get('disposition') === lib.disposition.APPROVED) {

                        var eventType = (record.get('type') == 'email')
                            ? 'EmailJobApproved'
                            : 'PrintJobApproved';

                        console.log("Raising '" + eventType + "' Event");

                        _raiseEvent(console, {
                            token: params.token,
                            logLevel: params.logLevel,
                            type: eventType,
                            jobId: params.jobId,
                            comments: record.get('comments'),
                            eventDate: rpcUtils.helpers.fmtDate()
                        });

                    } else if(record.get('disposition') === lib.disposition.DECLINED) {

                        var eventType = (record.get('type') == 'email')
                            ? 'EmailJobDeclined'
                            : 'PrintJobDeclined';

                        console.log("Raising '" + eventType + "' Event");

                        _raiseEvent(console, {
                            token: params.token,
                            logLevel: params.logLevel,
                            type: eventType,
                            jobId: params.jobId,
                            comments: record.get('comments'),
                            eventDate: rpcUtils.helpers.fmtDate()
                        });
                    }

                    next();
                });

            },

            (err, results) => done(err, state)
        );
    }

    function _raiseEvent(console, eventParams) {

        console.log(`Raising '${eventParams.type}' Event (Background Task)`);

        seneca.$Proxy.eventService.raiseEvent(eventParams, (err, data) => {
            if(err)
                console.error("Failed to raise event.\n", err);
            else
                console.debug("Event raised successfully.");
        });
    }

};
